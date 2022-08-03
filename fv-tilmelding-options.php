<?php

class FVTilmeldingOptions {

  static $options;
  static $pages = ['signup', 'test'];
  static $names = [
    'signup' => 'tilmeldingsside',
    'test' => 'test side',
  ];

  static function init() {
    self::$options = get_option('fv_tilmelding_options');
    // error_log("Options:\n".print_r(self::$options, true), 3, plugin_dir_path(__FILE__)."/debug.log");

    // Register settings page
    add_action( 'admin_menu', function() {
      add_menu_page(
        'FV Tilmelding Indstillinger', //page_title
        'FV Tilmelding', //menu_title
        'manage_options', //capability
        'fv_tilmelding', //menu_slug
        'FVTilmeldingOptions::render_settings_page', //callable function
        '', //icon_url, fx: plugin_dir_url(__FILE__) . 'images/icon_wporg.png',
        80 //position
      );
    });

    // Register settings
    add_action('admin_init', function() {
      // register a new setting for our settings page
      register_setting('fv_tilmelding_settings', 'fv_tilmelding_options');

      // register a new section for our settings page
      add_settings_section(
          'fv_tilmelding_settings_urls', // id
          'Tilmeldingssider', // title
          function() {
            echo "<p>Instillinger for navn og status på tilmeldingssider</p>";
            echo "<p>Den øverste side skal passe med navnet på den side der ligger i WordPress under \"Sider\"</p>";
          }, // callback
          'fv_tilmelding_settings' // page
      );

      // Register settings
      foreach(self::$pages as $page) {
        // Register settings field for signup page name
        add_settings_field(
          "fv_tilmelding_settings_{$page}_slug", // id
          'Navn på '.self::$names[$page], // title
          'FVTilmeldingOptions::render_settings_field', // callback
          'fv_tilmelding_settings', // page
          'fv_tilmelding_settings_urls', // section
          [
            'type' => 'text',
            'setting' => "{$page}_name",
          ] // args
        );

        // Register settings field for signup page status
        add_settings_field(
          "fv_tilmelding_settings_{$page}_status", // id
          ucfirst(self::$names[$page]).' åben', // title
          'FVTilmeldingOptions::render_settings_field', // callback
          'fv_tilmelding_settings', // page
          'fv_tilmelding_settings_urls', // section
          [
            'type' => 'checkbox',
            'setting' => "{$page}_status",
          ] // args
        );
      }
    });
  }

  static function render_settings_field($args) {
    $setting = self::$options[$args['setting']];
    if ($args['type'] == 'checkbox') {
      $value = true;
      $checked = isset( $setting ) ? 'checked="checked"' : '';
    } else {
      $value = isset( $setting ) ? esc_attr( $setting ) : '';
    }
    ?>
      <input type="<?=$args['type']?>" name="fv_tilmelding_options[<?=$args['setting']?>]" value="<?=$value?>" <?=$checked?>>
    <?php
  }

  static function render_settings_page() {
    ?>
      <div class="wrap">
        <h1><?= esc_html(get_admin_page_title()) ?></h1>
        <form action="options.php" method="post">
          <?php 
          // output security fields
          settings_fields( 'fv_tilmelding_settings' );
          // // output setting sections and their fields
          do_settings_sections( 'fv_tilmelding_settings' );
          // // output save settings button
          submit_button( __( 'Save Settings', 'textdomain' ) );
          ?>
        </form>
      </div>
    <?php
  }

  static function is_enabled_page($slug) {
    foreach (self::$pages as $page) {
      // Check if slug matches the page name
      if (self::$options[$page.'_name'] == $slug) {
        // Return true if page is enabled
        return isset(self::$options[$page.'_status']);
      }
    }
    // No pages were found that matched the slug
    return false;
  }

  static function default_page() {
    // Return slug of the first page in settings
    return self::$options[self::$pages[0].'_name'];
  }
}

