"using strict";

class FVSignupModuleHero {
  static element;
  static config;

  static init(element, callback) {
    this.element = jQuery('<div id="hero_module"></div>');
    element.append(this.element);

    FVSignup.load_config('hero', function (config) {
      FVSignupModuleHero.config = config;
      FVSignupModuleHero.render_hero();
      callback();
    });
  }

  static render_hero() {
    let lang = FVSignup.get_lang();
    this.element.append('<p>'+this.config.table_header[lang]+'</p>');

    let table = jQuery('<table class="hero-table"></table>');
    this.element.append(table);

    let table_body = jQuery('<tbody></tbody>');
    table.append(table_body);

    let top_row = jQuery('<tr><td></td></tr>');
    for (let day = 3; day <= 7; day++) {
      let day_text = FVSignup.uc_first(FVSignup.get_weekday(day));
      top_row.append('<td>'+day_text+'</td>');
    }
    table_body.append(top_row);

    for(const time_slot of this.config.times) {
      let time_row = jQuery('<tr></tr>');
      time_row.append('<td>'+time_slot.text[lang]+'</td>');
      let col = 0;
      if (!isNaN(time_slot.skip)) {
        while(col < time_slot.skip) {
          time_row.append('<td></td>');
          col++;
        }
      }
      while(col < 5) {
        let day_text = FVSignup.uc_first(FVSignup.get_weekday(col+3));
        time_row.append(`<td class="hero-time-cell">
          <input type="checkbox" id="hero:${col+3}-${time_slot.infosys_id}" submit-text="${day_text} ${time_slot.short_text[lang]}">
        </td>`);
        col++;
      }
      table_body.append(time_row);
    }

  }
}

FVSignup.register_module('hero', FVSignupModuleHero);
