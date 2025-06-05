<?php
defined('BASEPATH') or exit('No direct script access allowed');

class Api extends CI_Controller
{
    public function __construct()
    {
        parent::__construct();
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }

    // Fetch all products
    public function products()
    {
        header('Content-Type: application/json');
        $query = $this->db->get('products');
        echo json_encode([
            'status' => true,
            'data' => $query->result()
        ]);
    }

    // Add a new product
    public function add_product()
    {
        header('Content-Type: application/json');
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['name'], $data['price'], $data['category'], $data['image'])) {
            echo json_encode([
                'status' => false,
                'message' => 'Missing or invalid product data.'
            ]);
            return;
        }
        $insert = $this->db->insert('products', [
            'name'     => $data['name'],
            'price'    => $data['price'],
            'category' => $data['category'],
            'image'    => $data['image']
        ]);
        if ($insert) {
            echo json_encode([
                'status' => true,
                'message' => 'Product added successfully.'
            ]);
        } else {
            echo json_encode([
                'status' => false,
                'message' => 'Database insert failed.'
            ]);
        }
    }

    // --- SALES ENDPOINT (NOW SUPPORTS ITEMS & INVENTORY DEDUCTION) ---
    public function sales()
    {
        header('Content-Type: application/json');
        $data = json_decode(file_get_contents('php://input'), true);

        if (
            !$data ||
            !isset($data['sales_date'], $data['sales_time'], $data['subtotal'], $data['items']) ||
            !is_array($data['items'])
        ) {
            echo json_encode([
                'status' => false,
                'message' => 'Missing or invalid input data.'
            ]);
            return;
        }

        // Insert sale header
        $insert = $this->db->insert('sales', [
            'sales_date' => $data['sales_date'],
            'sales_time' => $data['sales_time'],
            'subtotal'   => $data['subtotal']
        ]);
        $sale_id = $this->db->insert_id();

        if (!$insert) {
            echo json_encode([
                'status' => false,
                'message' => 'Database insert failed.'
            ]);
            return;
        }

        // For each sold item: insert into sales_items and deduct inventory FIFO by expiry
        foreach ($data['items'] as $item) {
            $product_id = $item['product_id'];
            $quantity_needed = $item['quantity'];
            $price = $item['price'];

            // Insert into sales_items
            $this->db->insert('sales_items', [
                'sale_id' => $sale_id,
                'product_id' => $product_id,
                'quantity' => $quantity_needed,
                'price' => $price
            ]);

            // Deduct inventory FIFO by expiry_date
            $inventory_q = $this->db
                ->where('product_id', $product_id)
                ->where('quantity >', 0)
                ->order_by('expiry_date', 'ASC')
                ->get('inventory');

            foreach ($inventory_q->result() as $inv) {
                if ($quantity_needed <= 0) break;
                $deduct = min($inv->quantity, $quantity_needed);
                $this->db->where('id', $inv->id)->update('inventory', [
                    'quantity' => $inv->quantity - $deduct
                ]);
                $quantity_needed -= $deduct;
            }
        }

        echo json_encode([
            'status' => true,
            'message' => 'Sale processed and inventory updated.'
        ]);
    }

    // --- ADD INVENTORY ENDPOINT ---
    public function add_inventory()
    {
        header('Content-Type: application/json');
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || !isset($data['product_id'], $data['quantity'], $data['date_received'], $data['expiry_date'])) {
            echo json_encode([
                'status' => false,
                'message' => 'Missing or invalid input data.'
            ]);
            return;
        }

        $insert = $this->db->insert('inventory', [
            'product_id'   => $data['product_id'],
            'quantity'     => $data['quantity'],
            'date_received'=> $data['date_received'],
            'expiry_date'  => $data['expiry_date']
        ]);

        if ($insert) {
            echo json_encode([
                'status' => true,
                'message' => 'Inventory added successfully.'
            ]);
        } else {
            echo json_encode([
                'status' => false,
                'message' => 'Database insert failed.'
            ]);
        }
    }

    // --- GET INVENTORY ENDPOINT ---
    public function get_inventory()
    {
        header('Content-Type: application/json');
        $query = $this->db->get('inventory');
        echo json_encode([
            'status' => true,
            'data' => $query->result()
        ]);
    }
}