"using strict";

class FVSignupModuleFood {
  static element;

  static init(element, callback) {
    this.element = element;
    element.append('<div id="food_module"><p>Loading food module</p></div>');

    jQuery.getJSON({
      url: fv_signup_settings.infosys_url+"/api/signup/food",
      success: function (food) {
        //console.log(food);
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
    let element = FVSignupModuleFood.element.find('#food_module').empty();

    for (const [day, category] of Object.entries(food_info.days)) {
      let headline = FVSignup.get_weekday(day);
      headline = FVSignup.uc_first(headline);
      element.append('<p><strong>'+headline+'</strong></p>');
      for (const [cat, foods] of Object.entries(category)) {
        let cat_text = food_info.categories[cat][lang];
        cat_text = FVSignup.uc_first(cat_text);
        if (foods.length == 1) {
          element.append('<p>'+cat_text+'<p>');
          let checkbox = InfosysSignupRender.render_checkbox({id:"food:"+foods[0].id, text:foods[0].text[lang]});
          element.append(checkbox);
        } else {
          let item = {
            id: "food:"+cat+day,
            text: cat_text,
            lang: lang,
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
          let radio = InfosysSignupRender.render_radio(item);
          element.append(radio);
        }
      }
      //console.log(`${key}: ${value}`);
    }
  }
}

FVSignup.register_module('food', FVSignupModuleFood);