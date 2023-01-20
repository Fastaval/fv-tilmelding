"using strict";

class FVSignupModuleHero {
  static wrapper;
  static element;
  static config;
  static error_div;

  static init(element, callback) {
    this.wrapper = element;
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
    let minimum = this.config.min_select;
    let pre_table = this.config.pre_table[lang];
    this.element.append(`<p>${pre_table.replace("#", minimum)}</p>`);

    this.error_div = jQuery('<div id="activity-errors" class="error-text"></div>');
    this.element.append(this.error_div);

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

  static check_errors() {
    this.error_div.empty();

    if (this.wrapper.attr('status') == 'hidden') return [];

    let lang = FVSignup.get_lang();

    // Check if we have minimum selections
    let min = this.config.min_select;
    if(this.element.find(':checked').length < min) {
      let error_text = this.config.min_error[lang];
      this.error_div.append(`<p>${error_text.replace("#", min)}</p>`);
      
      return [{
        type: 'min_selection',
        module: 'hero',
      }]
    }
    
    // No errors
    return [];
  }

  static get_error_msg(error) {
    if (error.type != 'min_selection') return [null, null];

    let lang = FVSignup.get_lang();
    let count = this.element.find(':checked').length;
    let min = this.config.min_select;

    return [
      this.wrapper.find('h3').text(),
      this.config.min_error[lang].replace('#', min) +
      ` (${this.config.selected[lang]}: ${count})`,
    ]
  }
}

FVSignup.register_module('hero', FVSignupModuleHero);
