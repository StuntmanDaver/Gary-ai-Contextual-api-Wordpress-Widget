<?php
/**
 * Gary AI Settings Page Template
 *
 * @package GaryAI
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap gary-ai-admin">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    
    <div class="gary-ai-notices"></div>
    
    <!-- Tab navigation -->
    <h2 class="nav-tab-wrapper">
        <a href="#api" class="nav-tab nav-tab-active" data-tab="api">API Configuration</a>
        <a href="#general" class="nav-tab" data-tab="general">General Settings</a>
        <a href="#widget" class="nav-tab" data-tab="widget">Widget Settings</a>
    </h2>
    
    <form id="gary-ai-settings-form" method="post" action="options.php">
        <?php settings_fields('gary_ai_settings_group'); ?>
        
        <!-- API Configuration Panel -->
        <div id="gary-ai-panel-api" class="gary-ai-settings-panel">
            <table class="form-table">
                <?php do_settings_sections('gary-ai-api-config'); ?>
            </table>
        </div>

        <!-- General Settings Panel -->
        <div id="gary-ai-panel-general" class="gary-ai-settings-panel" style="display: none;">
            <table class="form-table">
                <?php do_settings_sections('gary-ai-general-settings'); ?>
            </table>
        </div>
        
        <!-- Widget Settings Panel -->
        <div id="gary-ai-panel-widget" class="gary-ai-settings-panel" style="display: none;">
            <table class="form-table">
                <?php do_settings_sections('gary-ai-widget-settings'); ?>
            </table>
        </div>
        
        <?php submit_button('Save Settings'); ?>
    </form>
</div>
