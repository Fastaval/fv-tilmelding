"using strict";
jQuery(function($) {
    let main_content = $(".post-content");
    let placeholder = $(".signup-placeholder");
    placeholder.remove();
    main_content.append(`
    <h2>Plugin loaded<h2>
    <p>plugin script has been successfully loaded.</p>
    `)
});