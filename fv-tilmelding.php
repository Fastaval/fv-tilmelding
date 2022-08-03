<?php
/**
Plugin Name: Fastaval Tilmeldingsmodul
Plugin URI: TBA
Description: Modul til styring af tilmelding for Rolle- og Bræspilskongressen Fastaval
Version: 0.0.1
Author: Mikkel Westh, Mads Thy
Author URI: https://westh.it
 */


add_action('parse_request', 'fv_tilmelding_parse_request');
function fv_tilmelding_parse_request($wp) {
  echo "<pre>";
  var_dump($wp);
  echo "</pre>";

  $setting = get_option('fv_tilmelding_option_name');
  if ($wp->request == $setting['tilmelding_url']) {
    $wp->query_vars = [
      "pagename" => $setting['post_name']
    ];

    //TODO add scripts to page
  }
}

add_action( 'admin_menu', 'fv_tilmelding_options_page' );
function fv_tilmelding_options_page() {
  add_menu_page(
    'FV Tilmelding Options Page', //page_title
    'FV Tilmelding Options', //menu_title
    'manage_options', //capability
    'fv_tilmelding', //menu_slug
    'fv_tilmelding_options_page_html', //callable function
    '', //icon_url, fx: plugin_dir_url(__FILE__) . 'images/icon_wporg.png',
    80 //position
  );
}

function fv_tilmelding_options_page_html() {
  include plugin_dir_path(__FILE__)."/fv-tilmelding-settings.php";
}

function fv_tilmelding_settings_init() {
  // register a new setting for "reading" page
  register_setting('fv_tilmelding_option_group', 'fv_tilmelding_option_name');

  // register a new section in the "reading" page
  add_settings_section(
      'fv_tilmelding_settings_section',
      'FV Tilmelding Settings Section',
      'fv_tilmelding_settings_section_callback',
      'fv_tilmelding_settings'
  );

  // register a new field in the "wporg_settings_section" section, inside the "reading" page
  add_settings_field(
      'fv_tilmelding_settings_url',
      'FV Tilmelding URL',
      'fv_tilmelding_settings_url_callback',
      'fv_tilmelding_settings',
      'fv_tilmelding_settings_section'
  );

  add_settings_field(
    'fv_tilmelding_settings_post', // id
    'FV Tilmelding Post Name', // title
    'fv_tilmelding_settings_post_callback', // callback
    'fv_tilmelding_settings', // page
    'fv_tilmelding_settings_section' // section
  );

}

/**
* register wporg_settings_init to the admin_init action hook
*/
add_action('admin_init', 'fv_tilmelding_settings_init');

/**
* callback functions
*/

// section content cb
function fv_tilmelding_settings_section_callback() {
  echo '<p>FV Tilmelding Section Introduction.</p>';
}

// field content cb
function fv_tilmelding_settings_url_callback() {
  // get the value of the setting we've registered with register_setting()
  $setting = get_option('fv_tilmelding_option_name');
  // output the field
  ?>
  <input type="text" name="fv_tilmelding_option_name[tilmelding_url]" value="<?php echo isset( $setting['tilmelding_url'] ) ? esc_attr( $setting['tilmelding_url'] ) : ''; ?>">
  <?php
}

function fv_tilmelding_settings_post_callback() {
  $setting = get_option('fv_tilmelding_option_name');
  // output the field
  ?>
  <input type="text" name="fv_tilmelding_option_name[post_name]" value="<?php echo isset( $setting['post_name'] ) ? esc_attr( $setting['post_name'] ) : ''; ?>">
  <?php
}