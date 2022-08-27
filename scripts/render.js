"using strict";

class FVSignupRender {
  static navigation(pages, keys, element) {
    let navigation = jQuery("<nav></nav>");
    let lang = fv_signup_settings.lang;

    keys.forEach( key => {
      let slug = "<div page-id='"+key+"'>"+pages[key].slug[lang]+"</div>";
      navigation.append(slug);    
    })
    element.append(navigation);
  }

  static page(page, key, element) {
    let lang = fv_signup_settings.lang;

    let page_section = element.find("section#"+key);
    if (!page_section.length) {
      page_section = jQuery("<section id='"+key+"'></section>")
      page_section.hide();
      element.append(page_section);
    }

    page_section.empty();
    page_section.append("<h2>"+page.title[lang]+"<h2>");
  }
}