'using strict';

class FVSignupModulePronouns {
  static single_pronouns = {
    none: {
      text: { en: 'None', da: 'Ingen' },
      default: true,
    },
    ns: {
      // Neutral Subject
      text: { en: 'They', da: 'De' },
    },
    no: {
      // Neutral Object
      text: { en: 'Them', da: 'Dem' },
    },
    fs: {
      // Feminine Subject
      text: { en: 'She', da: 'Hun' },
    },
    fo: {
      // Feminine Object
      text: { en: 'Her', da: 'Hende' },
    },
    ms: {
      // Masculine Subject
      text: { en: 'He', da: 'Han' },
    },
    mo: {
      // Masculine Object
      text: { en: 'Him', da: 'Ham' },
    },
    ask: {
      text: { en: 'Ask me', da: 'Spørg mig' },
    },
  };

  static init(element, callback) {
    let lang = FVSignup.get_lang();

    let wrapper = jQuery('<div id="pronouns_module" class="module-div special-submit" module="pronouns"></div>');
    element.append(wrapper);

    let options = [];
    for (const [key, element] of Object.entries(this.single_pronouns)) {
      let option = element;
      option.value = key;
      options.push(option);
    }

    let select = {
      infosys_id: 'pronouns1',
      options: options,
    };

    this.pronoun1 = InfosysSignupRender.render_select_input(select, lang);

    this.divider = jQuery('<p>/</p>');

    select.infosys_id = 'pronouns2';
    select.options.shift();
    select.options.pop();
    select.options.unshift({
      value: '',
      text: { en: '', da: '' },
      default: true,
    });
    this.pronoun2 = InfosysSignupRender.render_select_input(select, lang);

    wrapper.append(this.pronoun1);
    wrapper.append(this.divider);
    wrapper.append(this.pronoun2);

    this.pronoun1.on('change', () => {
      FVSignupModulePronouns.change1();
    });
    this.pronoun2.on('change', () => {
      FVSignupModulePronouns.change2();
    });

    this.change1();
    callback();
  }

  static change1() {
    let val = this.pronoun1.val();
    let part2_hidden = this.pronoun2.is(':hidden');

    if (val == 'none' || val == 'ask') {
      this.pronoun2.hide();
      this.divider.hide();
      this.pronoun2.val('');
      this.update_select('', this.pronoun1);
    } else {
      this.pronoun2.show();
      this.divider.show();
    }

    // Did we unhide the 2nd select?
    if (part2_hidden && !this.pronoun2.is(':hidden')) {
      let pair = { ns: 'no', fs: 'fo', ms: 'mo' };

      // Set 2nd select to most common pair
      if (pair[val]) {
        this.pronoun2.val(pair[val]);
      }
    }

    this.update_select(val, this.pronoun2);
  }

  static change2() {
    let val = this.pronoun2.val();
    this.update_select(val, this.pronoun1);
  }

  static update_select(val, select) {
    select.find('option').each((_, option) => {
      option = jQuery(option);
      option.prop('disabled', option.val() == val);
    });
  }

  static get_submission() {
    let val = this.pronoun1.val();

    if (val != 'none' && val != 'ask') {
      val += this.pronoun2.val();
    }

    return { pronouns: val };
  }

  static get_confirm(entry) {
    let lang = FVSignup.get_lang();
    let text = {
      en: 'Pronouns',
      da: 'Pronomener',
    }[lang];

    let value = entry.value;
    if (value == 'ask' || value == 'none') {
      return [text, this.single_pronouns[value].text[lang]];
    }

    if (value.length == 2 && this.single_pronouns[value]) {
      return [text, this.single_pronouns[value].text[lang]];
    }

    if (value.length == 4) {
      let part1 = value.substring(0, 2);
      let part2 = value.substring(2, 4);

      if (this.single_pronouns[part1] && this.single_pronouns[part2]) {
        let value = this.single_pronouns[part1].text[lang];
        value += '/' + this.single_pronouns[part2].text[lang];

        return [text, value];
      }
    }

    return [text, '!Error!'];
  }

  static load_from_server(data) {
    let value = data.pronouns;

    if (value == 'ask' || value == 'none') {
      this.pronoun1.val(value);
      this.change1();
      return;
    }

    if (value?.length == 2 && this.single_pronouns[value]) {
      this.pronoun1.val(value);
      this.change1();
      this.pronoun2.val('');
      return;
    }

    if (value?.length == 4) {
      let part1 = value.substring(0, 2);
      let part2 = value.substring(2, 4);

      if (this.single_pronouns[part1] && this.single_pronouns[part2]) {
        this.pronoun1.val(part1);
        this.change1();

        this.pronoun2.val(part2);
        this.change2();
        return;
      }
    }

    this.pronoun1.val('none');
    this.change1();
  }
}

FVSignup.register_module('pronouns', FVSignupModulePronouns);
