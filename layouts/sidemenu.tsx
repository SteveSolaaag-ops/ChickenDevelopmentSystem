import { Link } from 'react-router-dom';
import logo from '../assets/chickenlogo.png';

function Sidemenu() {
  return (
    <aside className="app-sidebar" id="sidebar">
      <div className="main-sidebar-header">
        <a href="/" className="header-logo"></a>
      </div>
      <div className="main-sidebar" id="sidebar-scroll">
        <nav className="main-menu-container nav nav-pills flex-col sub-open">
          <div className="slide-left" id="slide-left"></div>
          <ul className="main-menu">
            <li>
              <a href="">
                <center>
                  <img src={logo} className="transparent-shadow" style={{ maxHeight: '150px' }} />
                </center>
              </a>
            </li>
            <li>
              <hr className="mt-3" />
            </li>
            <li className="slide__category">
              <span className="category-name">Main</span>
            </li>
            <li className="slide">
              <Link to="/sales" className="side-menu__item">
                <i className="w-6 h-4 side-menu_icon bi bi-cash"></i>
                <span className="side-menu__label">Sales</span>
              </Link>
            </li>
            <li className="slide">
              <Link to="/Saleshistory" className="side-menu__item">
                <i className="w-6 h-4 side-menu_icon bi bi-cash"></i>
                <span className="side-menu__label">Sales History</span>
              </Link>
            </li>
            <li className="slide">
              <Link to="/inventory" className="side-menu__item">
                <i className="w-6 h-4 side-menu_icon bi bi-box"></i>
                <span className="side-menu__label">Inventory</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}

export default Sidemenu;