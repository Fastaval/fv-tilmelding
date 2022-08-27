"using strict";

var fv_signup_settings;

jQuery(function() {
  FVSignup.init();
});

class FVSignup {
  static init () {
    let placeholder = jQuery(".signup-placeholder");
    placeholder.remove();

    this.main_content = jQuery(".post-content");
    this.main_content.append("<h1>Fastaval Tilmelding</h1>");

    this.loaded_pages = {};
    this.load_page_list();
  }

  static load_page_list () {
    jQuery.getJSON({
      url: fv_signup_settings.infosys_url+"/api/signup/pagelist",
      success: function (pages) {
        FVSignup.parse_page_list(pages);
      }
    })
  }

  static parse_page_list(pages) {
    // Sort page keys by ordering
    let keys = Object.keys(pages);
    this.page_keys = keys.sort((a,b) => {
      return pages[a].order - pages[b].order;
    })

    // Render navigation
    FVSignupRender.navigation(pages, this.page_keys, this.main_content);
    // Setup navigation functionality
    this.main_content.find("nav div").click((evt) => {
      FVSignupEvent.nav_click(evt, this.main_content);
    })
    // Fully load pages
    setTimeout( () => {this.load_pages(keys)});
  }

  static load_pages(keys) {
    keys.forEach( key => {
      this.load_page(key);
    })
  }
 
  static load_page(key, force = false) {
    if (this.loaded_pages[key] !== undefined && force !== true) return;

    jQuery.getJSON({
      url: fv_signup_settings.infosys_url+"/api/signup/page/"+key,
      success: function (page) {
        FVSignup.loaded_pages[key] = page;
        FVSignupRender.page(page, key, FVSignup.main_content);
      }
    })
  }
}