"using strict";

class FVSignupModuleFood {
  static div;

  static init(element, callback) {
    this.div = jQuery('<div id="food_module" class="module-div special-submit" module="food"></div>');
    this.div.append('<p>Loading food module</p>');
    element.append(this.div);

    jQuery.getJSON({
      url: fv_signup_settings.infosys_url+"/api/signup/food",
      success: function (food) {
        FVSignupModuleFood.render_food(food);
      }
    }).fail(function () {
      FVSignup.com_error();
    }).always(function (){
      callback();
    });
  }

  static render_food(food_info) {
    let lang = fv_signup_settings.lang;
    this.div.empty();

    for (const [day, category] of Object.entries(food_info.days)) {
      let headline = FVSignup.get_weekday(day);
      headline = FVSignup.uc_first(headline);
      this.div.append('<p><strong>'+headline+'</strong></p>');
      for (const [cat, foods] of Object.entries(category)) {
        let cat_text = food_info.categories[cat][lang];
        cat_text = FVSignup.uc_first(cat_text);
        if (foods.length == 1) {
          this.div.append('<p>'+cat_text+'<p>');
          let checkbox = InfosysSignupRender.render_checkbox({
            infosys_id: "food:"+foods[0].id, 
            processed: foods[0].text[lang]
          });
          this.div.append(checkbox);
        } else {
          let item = {
            infosys_id: "food:"+cat+day,
            processed: cat_text,
            options: [
              {
                value: 0,
                text: {
                  da: 'Nej tak',
                  en: 'No, thanks',
                },
                default: true,
              }
            ],
          }
          foods.forEach(food => {
            food.value = food.id;
            item.options.push(food);
          })
          let radio = InfosysSignupRender.render_radio(item, lang);
          this.div.append(radio);
        }
      }
    }
  }

  static get_submission() {
    let submission = {};
    let inputs = this.div.find('input').not('[type=radio]');
    inputs.each(function () {
      let input = jQuery(this);
      if (input.attr('type') == 'hidden' && input.val() != '0') {
        submission[input.attr('id')] = input.val();
      }
      if (input.attr('type') == 'checkbox' && input.prop('checked')) {
        submission[input.attr('id')] = input.val();
      }
    })
    return submission;
  }

  static load_from_server(signup_data) {
    let food_data = signup_data.food;
    food_data.forEach(function(food_id) {
      let input = FVSignupModuleFood.div.find('input#food\\:'+food_id);
      if (input.length !== 0) {
        input.prop('checked', true);
        return;
      }
      input = FVSignupModuleFood.div.find(`input[type=radio][value=${food_id}]`);
      if (input.length !== 0) {
        input.prop('checked', true);
        input.change();
        return;
      }
    })
  }
}

FVSignup.register_module('food', FVSignupModuleFood);