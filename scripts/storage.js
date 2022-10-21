"using strict";

class FVSignupStorage {
  static profile = 'default';
  
  static page_loaded(key) {
    let page = jQuery('.signup-page#'+key);
    let inputs = page.find('input, textarea').not('[type="radio"]');
    inputs.change(function (evt) {
      FVSignupStorage.input_changed(evt.target);
    })

    for(const input of inputs) {
      let value;
      if (input.id == 'gdpr_accept') continue;
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
        if (button.value == value) button.checked = true;
      }
    }
    if (wrapper.hasClass('activity-choice')) {
      FVSignupLogicActivities.choice_change(jQuery(input));
    }
    if (wrapper.hasClass('wear-item')) {
      FVSignupModuleWear.load_input(jQuery(input));
    }
  }

  static input_changed(input) {
    let value = input.type == 'checkbox' ? input.checked : input.value;
    localStorage.setItem(this.profile+'.'+input.id, value);
  }
}