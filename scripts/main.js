"using strict";

var fv_signup_settings;

jQuery(function() {
  FVSignup.init();
  FVSignupEvent.init();
});

class FVSignup {
  static init () {
    let placeholder = jQuery(".signup-placeholder");
    placeholder.remove();

    this.main_content = jQuery(".post-content");
    this.main_content.append("<h1 id='signup-header'>Fastaval Tilmelding</h1>");

    this.navigation = jQuery("<nav id='signup-navigation'></nav>");
    this.main_content.append(this.navigation);
    
    this.page_wrapper = jQuery("<div id='signup-pages'></div>");
    this.main_content.append(this.page_wrapper);

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
    FVSignupRender.navigation(pages, this.page_keys, this.navigation);
    // Setup navigation functionality
    this.main_content.find("nav div").click((evt) => {
      let key = evt.target.getAttribute("page-id");
      FVSignupEvent.nav_click(key);
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
        FVSignupRender.page(page, key, FVSignup.page_wrapper);
        FVSignupEvent.page_loaded(page, key);
      }
    })
  }

  static add_module(module, element) {
    switch (module) {
      case "food":
        FVSignupModuleFood.init(element);
        break;
    
      case "activities":
        FVSignupModuleActivities.init(element);
        break;

      default:
        FVSignupRender.unknown_module(module, element);
        break;
    }
  }

  static days = {
    en: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
    da: [
      'mandag',
      'tirsdag',
      'onsdag',
      'tordsag',
      'fredag',
      'lørdag',
      'søndag',
    ]
  };

  static get_day(day) {
    return this.days[fv_signup_settings.lang][day-1];
  }
}