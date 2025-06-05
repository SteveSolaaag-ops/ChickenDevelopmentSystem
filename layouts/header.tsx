function Header() {
    return (
      <>
        <header className="app-header sticky" id="header">
          <div className="main-header-container container-fluid">
            <div className="header-content-left">
              <div className="header-element">
                <div className="horizontal-logo">
                  <a href="index.html" className="header-logo">
                    <img
                      src="/assets/images/brand-logos/desktop-logo.png"
                      alt="logo"
                      className="desktop-logo"
                    />
                  </a>
                </div>
              </div>
            </div>
            <div className="header-content-right flex items-center">
              {/* Menu Button */}
              <div className="header-element mx-lg-0">
                <a
                  aria-label="Open Menu"
                  className="sidemenu-toggle header-link animated-arrow hor-toggle horizontal-navtoggle"
                  data-bs-toggle="sidebar"
                  href="javascript:void(0);"
                >
                  <span></span>
                </a>
              </div>
  
              {/* Logout Button Inside Menu */}
              <div className="header-element">
                <button
                  className="btn btn-danger text-white font-bold ml-4"
                  onClick={() => alert("Logging out...")}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>
      </>
    );
  }
  
  export default Header;