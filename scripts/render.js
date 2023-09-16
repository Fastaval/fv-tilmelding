"using strict";

class FVSignupRender {
  static navigation(pages, keys, navigation) {
    let lang = fv_signup_settings.lang;

    keys.forEach( key => {
      let slug = "<div page-id='"+key+"' class='loading'>"+pages[key].slug[lang]+"</div>";
      navigation.append(slug);    
    })
  }

  static page(page, key, element, callback) {
    let lang = fv_signup_settings.lang;
    
    let disabled = false;
    let logic = FVSignup.get_page(key).page_logic;
    if (logic && logic.default == 'disabled') disabled = true;

    let page_div = element.find("div#"+key);
    if (!page_div.length) {
      page_div = jQuery('<div id="'+key+'" class="signup-page"></div>');
      if (disabled) page_div.addClass('disabled');
      page_div.hide();
      element.append(page_div);
    }

    page_div.empty();
    page.title[lang] && page_div.append("<h2>"+page.title[lang]+"</h2>");

    let module = false;
    if (page.sections) page.sections.forEach(function(section) {
      let section_wrapper = jQuery('<div class="section-wrapper"></div>');
      page_div.append(section_wrapper);

      if (section.section_id) section_wrapper.attr('id', 'page-section-'+section.section_id);
      if (section.headline) section_wrapper.append("<h3>"+section.headline[lang]+"</h3>");

      // Folding logic
      if (section.folding) {
        let section_content = jQuery('<div class="folding-content"></div>');
        section_wrapper.append(section_content);
        
        let  toggle = jQuery(`<div class="folding-text show">${section.folding.show[lang]}</div>`);
        section_wrapper.append(toggle);

        toggle.click(function() {
          section_content.toggle();
          toggle.text(section_content.is(":visible") ? section.folding.hide[lang] : section.folding.show[lang])
        })

        section_wrapper = section_content;
        section_wrapper.hide();
      }

      // Required selection logic
      if (section.require_one || section.require_one_if) {
        let error_div = jQuery('<div class="error-text" error-type="require_one"></div>');
        if (section.special_require_error) {
          error_div.text(FVSignup.config.errors[section.special_require_error][lang]);
        } else {
          error_div.text(FVSignup.config.errors["require_one"][lang]);
        }
        error_div.hide();
        section_wrapper.append(error_div);
      }

      // Insert module for section
      if (section.module) {
        section_wrapper.addClass('module-wrapper');
        FVSignup.add_module(section.module, section_wrapper, callback);
        module = true;
      }

      // Render section items
      if (section.items) section.items.forEach(function(item) {
        if (item.disabled) return;
        FVSignupLogic.require_config(function() {
          section_wrapper.append(InfosysSignupRender.render_element(item, lang, FVSignup.config));
        })
      })

    });

    let footer = jQuery('<div class="signup-page-footer"></div>');
    page_div.append(footer);

    if (page.order > 1) {
      let text = lang == 'da' ? 'Forrige' : 'Previous';
      let prev_button = jQuery('<button></button>');
      prev_button.addClass('previous-button');
      prev_button.text(text);
      prev_button.click(function() { FVSignupLogic.prev(); });
      footer.append(prev_button);
    }
    if (key != FVSignup.last_page) {
      let text = lang == 'da' ? 'Næste' : 'Next';
      let next_button = jQuery('<button></button>');
      next_button.addClass('next-button');
      next_button.text(text);
      next_button.click(function() {FVSignupLogic.next(); });
      footer.append(next_button);
    }

    let nav_button = jQuery("nav div[page-id='"+key+"']");
    if (disabled) nav_button.addClass('disabled');
    nav_button.removeClass('loading');
    nav_button.addClass('ready');

    // If page has a module we need to wait for it to load before page is ready
    if (!module) {
      callback();
    }
  }

  static unknown_module(name, element) {
    element.append('<p><strong>Unknown module '+name+'</strong></p>');
  }
}