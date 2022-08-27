"using strict";

class FVSignupEvent {
    static nav_click(evt, element) {
        element.find('nav div.selected').removeClass('selected');
        jQuery(evt.target).addClass('selected');
        element.find('section').hide();
        let page_id = evt.target.getAttribute("page-id");
        element.find('section#'+page_id).show();
    }
}