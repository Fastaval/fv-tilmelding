"using strict";

class FVSignupLogic {
  static current_page = null;
  static page_status = {};
  static page_listeners = {};

  static page_list(pages) {
    for(const key in pages) {
      this.page_status[key] = 'known';
    }
  }

  static nav_click(key) {
    // Move selection
    FVSignup.main_content.find('nav div.selected').removeClass('selected');
    FVSignup.main_content.find('nav div[page-id="'+key+'"]').addClass('selected');

    // Hide all pages
    FVSignup.page_wrapper.find('div.signup-page').hide();
    
    // Show current page
    FVSignup.page_wrapper.find('div#'+key).show();
    this.current_page = key;
    if(this.page_listeners[key]) {
      for(const callback of this.page_listeners[key]) {
        callback();
      }
    }
  }

  static on_page(page, callback) {
    if (this.page_listeners[page] == undefined) {
      this.page_listeners[page] = [];
    }
    this.page_listeners[page].push(callback);
  }

  static page_ready(page, key) {
    // Open the first page when it's ready (unless we seleted another already)
    if (this.current_page == null && page.order == 1) {
      FVSignup.main_content.find('nav div[page-id="'+key+'"]').addClass('selected');
      FVSignup.page_wrapper.find('div#'+key).show();
      this.current_page = key;
    }

    // Mark page as ready and check if all pages are done
    this.page_status[key] = 'ready';
    let waiting = Object.values(this.page_status).filter(function(value) {
      return value != 'ready';
    })
    if (waiting.length == 0) {
      this.all_loaded();
    }
  }

  static all_loaded() {
    this.init_radio_logic();
  }

  static init_radio_logic() {
    jQuery('input[type="radio"]').change(function (evt){
      let radio = jQuery(evt.target);
      let wrapper = radio.closest('.input-wrapper.input-type-radio');
      let hidden = wrapper.find('input#'+radio.attr('name'));
      hidden.val(radio.val());
      hidden.change();
    });
  }
}