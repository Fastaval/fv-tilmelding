"using strict";

class FVSignupStorage {
  static profile = 'default';
  static config;

  static init(element) {
    this.element = element;

    FVSignup.load_config('storage', function(config) {
      FVSignupStorage.config = config;
      FVSignupStorage.render_controls();
    })
  }

  static render_controls() {
    let lang = FVSignup.get_lang();

    let controls_header = jQuery('<h3 class="foldout">'+this.config.header[lang]+'</h3>');
    this.element.append(controls_header);

    let controls_content = jQuery('<div id="storage-controls-content"></div>');
    controls_content.hide();
    this.element.append(controls_content);

    controls_header.click(function() {
      controls_content.toggle();
      if (controls_content.is(":visible")) {
        controls_header.addClass('open');
      } else {
        controls_header.removeClass('open');
      }
    })

    controls_content.append('<p>'+this.config.from_server[lang]+':</p>');
    let load_wrapper = jQuery('<div id="load-signup-wrapper"></div>');
    load_wrapper.append(`
      <label for="load-signup-id">${this.config.signup_id[lang]}:</label>
      <input type="text" id="load-signup-id">
      <label for="load-signup-pass">${this.config.signup_pass[lang]}:</label>
      <input type="password" id="load-signup-pass">
      
    `)
    controls_content.append(load_wrapper);

    let load_button = jQuery(`<button>${this.config.load[lang]}</button>`);
    load_wrapper.append(load_button);

    load_wrapper.find('input').keypress(function(evt) {
      if(evt.originalEvent.key == "Enter") load_button.click();      
    })

    load_button.click(function () {
      let id = FVSignupStorage.element.find('#load-signup-id').val();
      let pass = FVSignupStorage.element.find('#load-signup-pass').val();

      let data = {
        id: id,
        pass: pass,
      };

      jQuery.ajax({
        type: "POST",
        dataType: "json",
        url: FVSignup.get_infosys_url()+"/api/signup/load",
        data: data,
        success: function (result) {
          if (result.errors.length > 0) {
            FVSignup.com_error();
            return;  
          }
          FVSignupStorage.load_from_server(result.signup);
          FVSignupModuleSubmit.set_info(result.signup.id, pass);
          alert(FVSignupStorage.config.load_success[lang]);
          controls_content.hide();
          controls_header.removeClass('open');
          
          // Clear possible errors
          for(const key of FVSignup.page_keys) {
            if(key == 'confirm') continue;
            if(FVSignupLogic.is_page_disabled(key)) continue;
            FVSignupLogic.check_page(key);
          }      
        }
      }).fail(function (data) {
          if (data.responseJSON && data.responseJSON.errors) {
            let processed = false;
            data.responseJSON.errors.forEach(function(error) {
              let msg = FVSignupStorage.config.errors[error.type];
              if (msg) {
                alert(msg[lang]);
                processed = true;
                return false;
              }
            })

            if (processed) return;
          }
        
          FVSignup.com_error();
      });
    })
  }

  static load_from_server(signup_data) {
    let inputs = jQuery('#signup-pages').find('input, textarea, select').not('[type="radio"]');

    // Remove special module inputs
    inputs = inputs.not('.special-submit *');

    for(const input of inputs) {
      if (jQuery(input).attr('no-load') == 'true') continue;
      let value = '';
      if (signup_data[input.id] !== undefined) {
        value = signup_data[input.id];
      }
      switch (input.type) {
        case 'checkbox':
          input.checked = !!value;
          break;

        case 'hidden':
          this.load_hidden(input, value);
          break;

        default:
          input.value = value;
      }
      jQuery(input).change();
    }

    // Handle special modules
    jQuery('.special-submit').each(function() {
      let module_id = jQuery(this).attr('module');
      let module = FVSignup.get_module(module_id)
      if(module) module.load_from_server(signup_data);
    })

    FVSignupLogic.refresh_page();
  }
  
  static page_loaded(key) {
    let page = jQuery('.signup-page#'+key);
    let inputs = page.find('input, textarea').not('[type="radio"]');
    inputs.change(function (evt) {
      FVSignupStorage.input_changed(evt.target);
    })

    for(const input of inputs) {
      if (input.id == 'gdpr_accept') continue;
      let value;
      if (value = localStorage.getItem(this.profile+'.'+input.id)) {
        switch (input.type) {
          case 'checkbox':
            input.checked = value == 'true';
            break;

          case 'hidden':
            this.load_hidden(input, value);
            break;

          default:
            input.value = value;
        }
      }
    }
  }

  static load_hidden(input, value) {
    input.value = value;
    let wrapper = jQuery(input).closest('.input-wrapper');
    if (wrapper.hasClass('input-type-radio')) {
      let buttons = wrapper.find('input[type="radio"]');
      for (const button of buttons) {
        // If values are equal or they're both falsy, the button should be selected
        button.checked = (button.value == value) || (button.value == '0' && !value);
      }
    }
    if (wrapper.hasClass('activity-choice')) {
      FVSignupLogicActivities.choice_change(jQuery(input));
    }
    if (wrapper.hasClass('wear-item')) {
      FVSignupModuleWear.load_input(jQuery(input));
    }
    if (wrapper.hasClass('autocomplete')) {
      let text_input = wrapper.find('input[type=text]');
      let list = FVSignup.config.autocomplete[wrapper.attr('autocomplete-list')];
      let lang = FVSignup.get_lang();
      let input_text = ''
      if (list[value]) {
        input_text = list[value][lang] ?? list[value]['da'] // Fallback to danish
      }
      text_input.val(input_text)
    }
  }

  static input_changed(input) {
    let value = input.type == 'checkbox' ? input.checked : input.value;
    localStorage.setItem(this.profile+'.'+input.id, value);
  }
}