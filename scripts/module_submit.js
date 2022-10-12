"using strict";

class FVSignupModuleSubmit {
  static element;

  static init(element) {
    this.element = jQuery('<div id="submit_module"></div>');
    this.element.append('<p>Loading submit module</p>');
    element.append(this.element);

    FVSignupLogic.on_page('confirm', this.on_page);
  }

  static on_page() {
    let submission = {};
    for(const key of FVSignup.page_keys) {
      submission[key] = {};
      let inputs = jQuery('div#'+key+' input');
      inputs = inputs.not('[type="radio"]');
      for(const input of inputs) {
        if(input.value != "" && parseInt(input.value) != 0 && (input.type != 'checkbox' || input.checked == true)) {
          submission[key][input.id] = input.value;
        }
      }
    }
    console.log('Submission: ', submission);

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

  static render_submit(result) {

  }
}