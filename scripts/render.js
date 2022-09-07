"using strict";

class FVSignupRender {
  static navigation(pages, keys, navigation) {
    let lang = fv_signup_settings.lang;

    keys.forEach( key => {
      let slug = "<div page-id='"+key+"' class='loading'>"+pages[key].slug[lang]+"</div>";
      navigation.append(slug);    
    })
  }

  static page(page, key, element) {
    let lang = fv_signup_settings.lang;

    let page_div = element.find("div#"+key);
    if (!page_div.length) {
      page_div = jQuery('<div id="'+key+'" class="signup-page"></div>')
      page_div.hide();
      element.append(page_div);
    }

    page_div.empty();
    page.title[lang] && page_div.append("<h2>"+page.title[lang]+"</h2>");

    page.sections && page.sections.forEach(function(section) {
      section.headline && page_div.append("<h3>"+section.headline[lang]+"</h3>");
      section.items && section.items.forEach(function(item) {
        page_div.append(InfosysSignupRender.render_element(item, lang));
      })
    });

    let nav_button = jQuery("nav div[page-id='"+key+"']");
    nav_button.removeClass('loading');
    nav_button.addClass('ready');
  }
}