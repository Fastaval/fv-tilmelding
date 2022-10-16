"using strict";

class FVSignupModuleSubmit {
  static element;

  static init(element) {
    this.element = jQuery('<div id="submit_module"></div>');
    element.append(this.element);

    FVSignupLogic.on_page('confirm', function() {FVSignupModuleSubmit.on_page();});
  }

  static on_page() {
    this.element.empty();
    if (FVSignupLogic.missing_pages().length == 0) {
      let text = {
        en: 'Processing your submission',
        da: 'Behandler din tilmelding',
      }
      this.element.append('<p>'+text[FVSignup.get_lang()]+'</p>');
    } else {
      let text = {
        en: 'Waiting for all pages to load',
        da: 'Venter på at alle sider er hentet',
      }
      this.element.append('<p>'+text[FVSignup.get_lang()]+'</p>');
      FVSignupLogic.on_all_loaded('confirm', function() {FVSignupModuleSubmit.on_page();});
      return;
    }

    let submission = {};
    let errors = {
      total: 0,
    };
    
    // Collect data and check for errors
    for(const key of FVSignup.page_keys) {
      submission[key] = {};
      errors[key] = FVSignupLogic.check_page(key);
      errors.total += errors[key].length;
      if(errors.total != 0) continue; // No need to collect data if we have errors

      // Collect data from inputs
      let inputs = jQuery('div#'+key+' input');
      inputs = inputs.not('[type="radio"]'); // Radio buttons are tracked with hidden inputs
      for(const input of inputs) {
        if(input.value != "" && parseInt(input.value) != 0 && (input.type != 'checkbox' || input.checked == true)) {
          submission[key][input.id] = input.value;
        }
      }
    }

    if (errors.total != 0) {
      this.render_errors(errors);
      return;
    }
    //console.log('Submission: ', submission);

    jQuery.ajax({
      type: "POST",
      url: FVSignup.get_infosys_url()+"/api/signup/submit",
      data: submission,
      success: function (result) {
        FVSignupModuleSubmit.render_submit(result)
      },
      error: function(request, status, error) {
        FVSignup.com_error();
      }
    })
  }

  static render_errors(errors) {
    let lang = FVSignup.get_lang();
    this.element.empty();
    let text = {
      en: 'There are the following issues with your submission',
      da: 'Der er følgende problemer med din indtastning'
    };
    this.element.append('<p>'+text[lang]+'</p>');

    let wrapper = jQuery('<div class="errors"></div>');
    for (const page_key of FVSignup.page_keys) {
      if (errors[page_key].length == 0) continue;
      let page = FVSignup.get_page(page_key);
      let page_header = jQuery('<h3>'+page.title[lang]+'</h3>');
      wrapper.append(page_header);
      let table = jQuery('<table></table>');
      wrapper.append(table);
      let tbody = jQuery('<tbody></tbody>');
      table.append(tbody);
      for(const error of errors[page_key]) {
        let text = jQuery('label[for='+error.id+']').text().replace(':','');
        let desc = {
          required: {
            en: 'Field may not be empty',
            da: 'Feltet må ikke være tomt',
          },
          match: {
            en: 'Fields doesn\'t match',
            da: 'Felterne er ikke ens',
          }
        }
        tbody.append('<tr><td>'+text+'</td><td>'+desc[error.type][lang]+'</td></tr>');
      }
    }
    this.element.append(wrapper);
  }

  static render_submit(result) {
    let lang = FVSignup.get_lang();
    this.element.empty();
    let text = {
      en: 'This is an overview of your submission',
      da: 'Dette er en oversigt over din tilmelding'
    };
    this.element.append('<p>'+text[lang]+'</p>');
  }
}