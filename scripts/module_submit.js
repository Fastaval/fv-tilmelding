"using strict";

class FVSignupModuleSubmit {
  static element;
  static config;
  static page_header;

  static init(element, callback) {
    this.element = jQuery('<div id="submit_module"></div>');
    element.append(this.element);

    this.element.append('<input type="hidden" id="hash">');
    this.element.append('<input type="hidden" id="id">');
    this.element.append('<input type="hidden" id="pass">');

    this.status = jQuery('<div class="status"></div>');
    this.element.append(this.status);

    this.errors = jQuery('<div class="errors"></div>');
    this.element.append(this.errors);

    this.signup_data = jQuery('<div class="signup-data"></div>');
    this.element.append(this.signup_data);

    this.page_header = element.closest('.signup-page').find('h2').first();

    FVSignupLogic.add_listener('page_confirm', function() {FVSignupModuleSubmit.on_page();});
    FVSignup.load_config('submit', function (config) {
      FVSignupModuleSubmit.config = config;
      FVSignupModuleSubmit.config.loaded = true;
      FVSignupModuleSubmit.render_existing();
      FVSignupModuleSubmit.render_confirm();
      callback();
    });
  }

  static render_existing() {
    let lang = FVSignup.get_lang();

    FVSignup.existing_controls.hide();

    let text = jQuery(`<span>${this.config.existing[lang]} <span>`);
    FVSignup.existing_controls.append(text);
    
    this.display_id = jQuery(`<span id="display-id"><span>`);
    FVSignup.existing_controls.append(this.display_id);

    let button = jQuery(`<button>${this.config.reset[lang]}</button>`)
    FVSignup.existing_controls.append(button);
    button.click(function() {
      FVSignupLogic.reset_signup();
    })
  }

  static render_confirm() {
    let lang = FVSignup.get_lang();
    
    this.confirm_page = jQuery('<div class="confirm-page"></div>');
    this.element.append(this.confirm_page);

    let text = this.config.confirmationpage[lang];
    text = text.replaceAll('[ID]', '<span id="display-id"></span>');
    text = text.replaceAll('[TOTAL]', '<span id="display-total"></span>');
    text = text.replaceAll('[PAYDAY]', '<span id="display-payday"></span>');
    this.confirm_page.append('<p>'+text+'</p>');

    this.confirm_page.append('<p>'+this.config.create_new[lang]+'</p>');

    let new_button = jQuery('<button id="confirm-reset-button">'+this.config.reset[lang]+'</button>');
    this.confirm_page.append(new_button);
    new_button.click(function() {
      FVSignupLogic.reset_signup();
    })
  }

  static get_info() {
    // Set id and pass if we have them
    let id = parseInt(this.element.find('input#id').val());
    let pass = this.element.find('input#pass').val();
    if (id && !isNaN(id) && pass) {
      return {
        id: id,
        pass: pass,
      }
    }
    return undefined;
  }

  static set_info(id, pass) {
    this.element.find('input#id').val(id);
    this.element.find('input#pass').val(pass);
    this.display_id.text(id);

    if (id) {
      FVSignup.existing_controls.show();
    } else {
      FVSignup.existing_controls.hide();
    }
  }

  static on_page() {
    this.status.empty();
    this.errors.empty();
    this.signup_data.empty();
    this.confirm_page.hide();
    this.page_header.show();

    if (FVSignupLogic.missing_pages().length == 0) {
      let text = this.config.processing_text;
      this.status.append('<p>'+text[FVSignup.get_lang()]+'</p>');
    } else {
      let text = this.config.waiting_for_pages
      this.status.append('<p>'+text[FVSignup.get_lang()]+'</p>');
      FVSignupLogic.add_listener('all_loaded', function() {
        if (FVSignupLogic.current_page == 'confirm') {
          FVSignupModuleSubmit.on_page();
        }
      });
      return;
    }

    let submission = {};
    let errors = {
      total: 0,
    };
    
    // Collect data and check for errors
    for(const key of FVSignup.page_keys) {
      if(key == 'confirm') continue; // Don't send data from the confirm page
      if(FVSignupLogic.is_page_disabled(key)) continue;

      submission[key] = {};
      errors[key] = FVSignupLogic.check_page(key);
      errors.total += errors[key].length;
      if(errors.total != 0) continue; // No need to collect data if we have errors

      // Collect data from inputs
      let inputs = jQuery('div#'+key).find('input, textarea, select');
      inputs = inputs.not('[type="radio"]'); // Radio buttons are tracked with hidden inputs

      // Deal with special modules
      let module_div = jQuery(`div#${key} .special-submit`);
      module_div.each(function() {
        // Don't handle inputs inside the module
        inputs = inputs.not(`#${this.id} *`);

        // Get the submission from the module
        let module_id = jQuery(this).attr('module');
        let module = FVSignup.get_module(module_id)
        if(module) Object.assign(submission[key], module.get_submission());
      })

      for(const input of inputs) {
        // Ignore "no-submit" and disabled inputs
        if (input.attributes['no-submit'] || input.disabled) continue;

        // Submit checkbox
        if (input.type == 'checkbox' ) {
          submission[key][input.id] = input.checked ? input.value : 'off';
          continue;
        }

        // Check if input is empty and whether we need to submit it anyway
        let no_empty = input.attributes['no-submit-empty'];
        if(no_empty && no_empty.value == 'true' && (input.value == "" || parseInt(input.value) === 0)) continue;

        submission[key][input.id] = input.value;
      }
    }

    if (errors.total != 0) {
      this.status.empty();
      this.render_errors(errors);
      return;
    }

    let data = {
      signup: submission,
      info: this.get_info(),
      lang: FVSignup.get_lang(),
    }

    jQuery.ajax({
      type: "POST",
      dataType: "json",
      url: FVSignup.get_infosys_url()+"/api/signup/submit",
      data: data,
      success: function (response) {
        FVSignupModuleSubmit.submit_success(response);
      },
      error: function(request, status, error) {
        //console.log(request);
        if (request.responseJSON) {
          FVSignupModuleSubmit.render_errors(request.responseJSON.result.errors);
          FVSignupModuleSubmit.signup_data.empty();
        } else {
          FVSignup.com_error();
        }
      }
    })
  }

  static submit_success(response) {
    this.status.empty();
    if (response.result.errors.length > 0) {
      this.render_errors(response.result.errors);
    } else {
      this.errors.empty();
    }
    let hash = this.element.find('input#hash');
    hash.val(response.hash);
    hash.change();
    this.render_submit(response.result.categories, response.result.total);
  }

  static render_errors(errors) {
    let lang = FVSignup.get_lang();
    
    // Clear and show error section
    this.errors.empty();
    this.errors.show();

    // Add error subtext
    let text = this.config.error_text;
    this.errors.append('<p>'+text[lang]+'</p>');
    
    // Create error section for each page
    for (const page_key of FVSignup.page_keys) {
      // Skip empty sections
      if (!errors[page_key] || errors[page_key].length == 0) continue;
      
      // Create header and table for the section
      let page = FVSignup.get_page(page_key);
      let page_header = jQuery('<h3 class="category-header">'+page.title[lang]+'</h3>');
      this.errors.append(page_header);
      let table = jQuery('<table></table>');
      this.errors.append(table);
      let tbody = jQuery('<tbody></tbody>');
      table.append(tbody);
      
      // Get message and label for each error
      for(const error of errors[page_key]) {
        let msg, label;
        
        // Get message for the error
        if (error.module) { // Let modules handle special module errors
          let module = FVSignup.get_module(error.module);
          if (module.get_error_msg) [label, msg] = module.get_error_msg(error);
        } else if (error.id) { // Get error text from input wrapper
          msg = FVSignupLogic.get_error_text(error.id, error.type);
        } 

        // Get error label from input/section id
        if (error.id) {
          if (this.config.short_text[error.id]) {
            label = this.config.short_text[error.id][lang];
          } else if(error.section) {
            label = jQuery('div.section-wrapper#page-section-'+error.id).find('h3').text();
          } else {
            let id = error.id.replaceAll(':', '\\:');

            let label_element = jQuery(`label[for=${id}]`);
            if (label_element.length === 0) { // If input doesn't have a label it's probably a special hidden input
              label_element = jQuery(`label[for=${id}-display]`);
            }

            label = label_element.text().replace(':','');
          }
        }

        // Insert error row if we have both message and label
        if(msg && label) {
          tbody.append('<tr><td>'+label+'</td><td>'+msg+'</td></tr>');
          continue;
        } 

        // Add text for unknown label or message
        let text = this.config.unknown[lang];
        let col="";
        if (label) {
          text = label+'</td><td>'+text;
        } else if (msg) {
          text += '</td><td>'+msg;
        } else {
          col = 'colspan="2"';
        }
        tbody.append(`<tr><td ${col}>${text}</td></tr>`);
        console.log(error);
      }
    }
  }

  static render_submit(categories, grand_total) {
    let lang = FVSignup.get_lang();
    this.signup_data.empty();
    this.signup_data.show();
    
    let totals = [];

    for (const page_key of FVSignup.page_keys) {
      // Skip empty sections
      if (!categories[page_key] || categories[page_key].length == 0) continue;

      // Create section header and table
      let page = FVSignup.get_page(page_key);
      let page_header = jQuery('<h3 class="category-header">'+page.title[lang]+'</h3>');
      this.signup_data.append(page_header);
      let table = jQuery('<table></table>');
      this.signup_data.append(table);
      let tbody = jQuery('<tbody></tbody>');
      table.append(tbody);

      // Get text and values for entries
      for(const entry of categories[page_key]) {
        let input = FVSignup.get_input(entry.key);
        let text;
        let value = entry.value

        if (entry.special_module) { // Module entries
          [text, value] = FVSignup.get_module(entry.special_module).get_confirm(entry);
        } else if (input.attr('type') == 'hidden') { // Hidden inputs
          let wrapper = input.closest('.input-wrapper');
          switch (true) {
            case wrapper.hasClass('activity-choice'): // Activity selection
              // Activity title
              let top_row = wrapper.closest('.activity-row').prev();
              text = top_row.find('.title-wrapper').text() + " - ";

              // Get times from all parts
              if (wrapper.attr('multiblock')) {
                let run_id = wrapper.attr('run-id');
                wrapper = jQuery(`.activity-choice[run-id=${run_id}]`);
              } 

              // Activity time text
              let times = [];
              wrapper.each(function () {
                let element = jQuery(this);
                let day = element.closest('table').attr('activity-day');
                let time_text = FVSignup.uc_first(FVSignup.get_weekday(day))+" ";
                let time = new Date(parseInt(element.attr('run-start'))*1000);
                time_text += (time.getHours()+"").padStart(2, '0')+":"+(time.getMinutes()+"").padStart(2, '0');
                times.push(time_text);
              });
              text += times.join(', ');

              // Activity priority value
              let choices = FVSignupLogicActivities.config.choices;
              if (entry.value <= choices.prio[lang].length) {
                value = choices.prio[lang][entry.value-1];
              } else {
                let type = wrapper.attr('activity-type');
                value = choices.gm[type] ? choices.gm[type][lang] : choices.gm.default[lang];

                let index = entry.value - choices.prio[lang].length;
                if (index > 1) {
                  value += " "+choices.prio[lang][index-2];
                }
              }
              break;
          
            case wrapper.hasClass('input-type-hidden'): // Hidden automaic entries like ticket fee
              text = input.attr('text');
              break;

            case wrapper.hasClass('autocomplete'): // Autocomplete inputs
              text = wrapper.find('label').text().replace(':','');
              value = wrapper.find('input[type=text]').val();
              break;
              
            default: // Radio buttons
              text = wrapper.find('p').text();
              let option = wrapper.find('input[value='+value+'][name="'+entry.key+'"]');
              value = jQuery('label[for='+option.attr('id').replaceAll(':', '\\:')+']').text();
          }
        } else if (input.attr('submit-text')) { // Input has special submit text instead of label
          text = input.attr('submit-text');
        } else if (this.config.short_text[entry.key]) { // Config has special submit text for input (should probably be combined with above case)
          text = this.config.short_text[entry.key][lang];
        } else { // Default behavior is to get text from input label
          let id = entry.key.replaceAll(':', '\\:');
          text = jQuery('label[for='+id+']').text().replace(':','');
        }

        // Extra stuff for special values
        if (input.attr('submit-value')) { // Input has special submit text instead of value
          value = input.attr('submit-value');
          if (value.includes('{price}')) {
            value = value.replace("{price}", entry.price);
          }
        } else if (entry.price) { // Some special cases for price display
          if (entry.value == 'on') {
            value = entry.price+" "+FVSignup.config.dkk[lang];
          } else {
            if (entry.single_price) {
              text += ` (${entry.single_price} ${FVSignup.config.dkk[lang]})`
            } else {
              text += ` (${entry.price} ${FVSignup.config.dkk[lang]})`
            }
          }
        } else if (input.prop('tagName') === 'SELECT') { // Select input without price
          value = input.find('option:selected').text();
        }

        // Change value 'on' to affirmative
        if (value == 'on') {
          let value_text = {
            en: 'Yes',
            da: 'Ja',
          }
          value = value_text[lang];
        }

        // Section sub total
        if (entry.key == 'sub_total') {
          if (entry.value == 0) continue;
          value = entry.value + " "+FVSignup.config.dkk[lang];
          text = FVSignup.config.sub_total[lang];
          totals.push({
            name: page.title[lang],
            value: value,
          })
        }
        tbody.append('<tr><td>'+text+'</td><td>'+value+'</td></tr>');
      }
    }
    
    // Total
    let total_header = jQuery('<h3 class="category-header">Total</h3>');
    this.signup_data.append(total_header);
    let table = jQuery('<table></table>');
    this.signup_data.append(table);
    let tbody = jQuery('<tbody></tbody>');
    table.append(tbody);
    for(const total of totals) {
      tbody.append('<tr><td>'+total.name+':</td><td>'+total.value+'</td></tr>');
    }
    tbody.append('<tr><td>Total:</td><td>'+grand_total+' '+FVSignup.config.dkk[lang]+'</td></tr>');

    // Submit
    let button_text = this.config.button_text;
    let confirm_button = jQuery('<button id="confirm-submission-button">'+button_text[lang]+'</button>');
    confirm_button.click(function() {
      FVSignupModuleSubmit.confirm();
    });
    this.signup_data.append(confirm_button);
  }

  static confirm() {
    let button = jQuery('#confirm-submission-button');
    button.prop('disabled', true);
    
    let lang = FVSignup.get_lang();
    let text = jQuery('<p>'+this.config.submit_text[lang]+'</p>');

    let data = {
      hash: this.element.find('input#hash').val(),
      info: this.get_info(),
      lang: FVSignup.get_lang(),
    };

    jQuery.ajax({
      type: "POST",
      dataType: "json",
      url: FVSignup.get_infosys_url()+"/api/signup/confirm",
      data: data,
      success: function (response) {
        FVSignupModuleSubmit.confirm_success(response);
      },
      error: function(request, status, error) {
        //console.log(request);
        if (request.responseJSON) {
          FVSignupModuleSubmit.status.empty();
          FVSignupModuleSubmit.render_errors(request.responseJSON.result.errors);
          FVSignupModuleSubmit.signup_data.empty();
        } else {
          FVSignup.com_error();
        }
      }
    }).always(function () {
      button.prop('disabled', false);
    })

    this.status.append(text.clone());
    this.signup_data.append(text);
  }

  static confirm_success(response) {
    this.status.empty();
    if (response.result.errors.length > 0) {
      this.render_errors(response.result.errors);
    } else {
      this.errors.empty();
    }
    this.signup_data.hide();
    this.set_info(response.info.id, response.info.pass)
    this.confirm_page.find('#display-id').text(response.info.id);
    this.confirm_page.find('#display-total').text(response.result.total);
    
    // Calculate last payment
    let signup_end = new Date(FVSignup.config.signup_end.replace(/-/g, "/"));
    let tomorrow = new Date(Date.now() + 24*60*60);
    let payday = new Date(Math.max(signup_end.getTime(), tomorrow.getTime()));
    let payday_text = payday.getDate() + FVSignup.get_ordinal(payday.getDate()) + " " + FVSignup.get_month(payday.getMonth());
    this.confirm_page.find('#display-payday').text(payday_text);
    this.confirm_page.show();
    this.page_header.hide();
  }

  static get_confirm(entry) {
    let text, value = '';
    let lang = FVSignup.get_lang();
    
    if (this.config.warnings[entry.warning]) {
      text = `<strong>${this.config.warnings[entry.warning][lang]}</strong>`;
    } else {
      text = this.config.unknown[lang];
    }
    
    return [text, value];
  }
}

FVSignup.register_module('submit', FVSignupModuleSubmit);