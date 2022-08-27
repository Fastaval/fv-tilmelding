"using strict";

class FVSignupEvent {
    static init() {
        this.current_page = null;
    }

    static nav_click(key) {
        // Move selection
        FVSignup.main_content.find('nav div.selected').removeClass('selected');
        FVSignup.main_content.find('nav div[page-id="'+key+'"]').addClass('selected');

        // Hide all pages
        FVSignup.page_wrapper.find('div').hide();
        
        // Show current page
        FVSignup.page_wrapper.find('div#'+key).show();
        this.current_page = key;
    }

    static page_loaded(page, key) {
        if (this.current_page !== null || page.order !== 1) return;
        FVSignup.main_content.find('nav div[page-id="'+key+'"]').addClass('selected');
        FVSignup.page_wrapper.find('div#'+key).show();
        this.current_page = key;
    }
}