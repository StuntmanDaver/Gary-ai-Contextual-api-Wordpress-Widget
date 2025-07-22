<?php
/**
 * Gary AI Analytics Page Template
 *
 * @package GaryAI
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap gary-ai-admin">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    
    <div class="gary-ai-analytics-dashboard">
        <div class="gary-ai-stats-grid">
            <div class="gary-ai-stat-card">
                <h3>Total Conversations</h3>
                <div class="stat-number">0</div>
                <div class="stat-change">+0% from last month</div>
            </div>
            
            <div class="gary-ai-stat-card">
                <h3>Messages Sent</h3>
                <div class="stat-number">0</div>
                <div class="stat-change">+0% from last month</div>
            </div>
            
            <div class="gary-ai-stat-card">
                <h3>Average Response Time</h3>
                <div class="stat-number">0ms</div>
                <div class="stat-change">-0% from last month</div>
            </div>
            
            <div class="gary-ai-stat-card">
                <h3>User Satisfaction</h3>
                <div class="stat-number">0%</div>
                <div class="stat-change">+0% from last month</div>
            </div>
        </div>
        
        <div class="gary-ai-charts-section">
            <div class="gary-ai-chart-container">
                <h3>Conversation Volume</h3>
                <div id="conversation-chart" class="chart-placeholder">
                    <p>Chart will be implemented in Phase 3</p>
                </div>
            </div>
            
            <div class="gary-ai-chart-container">
                <h3>Popular Topics</h3>
                <div id="topics-chart" class="chart-placeholder">
                    <p>Chart will be implemented in Phase 3</p>
                </div>
            </div>
        </div>
        
        <div class="gary-ai-recent-conversations">
            <h3>Recent Conversations</h3>
            <div class="conversations-placeholder">
                <p>No conversations yet. Analytics will appear here once users start chatting with Gary AI.</p>
            </div>
        </div>
    </div>
</div>

<style>
.gary-ai-analytics-dashboard {
    margin-top: 20px;
}

.gary-ai-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.gary-ai-stat-card {
    background: #fff;
    border: 1px solid #ccd0d4;
    border-radius: 4px;
    padding: 20px;
    text-align: center;
}

.gary-ai-stat-card h3 {
    margin: 0 0 10px 0;
    font-size: 14px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.stat-number {
    font-size: 32px;
    font-weight: bold;
    color: #0073aa;
    margin-bottom: 5px;
}

.stat-change {
    font-size: 12px;
    color: #666;
}

.gary-ai-charts-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 30px;
}

.gary-ai-chart-container {
    background: #fff;
    border: 1px solid #ccd0d4;
    border-radius: 4px;
    padding: 20px;
}

.gary-ai-chart-container h3 {
    margin: 0 0 15px 0;
    font-size: 16px;
}

.chart-placeholder {
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9f9f9;
    border: 2px dashed #ddd;
    border-radius: 4px;
}

.gary-ai-recent-conversations {
    background: #fff;
    border: 1px solid #ccd0d4;
    border-radius: 4px;
    padding: 20px;
}

.gary-ai-recent-conversations h3 {
    margin: 0 0 15px 0;
    font-size: 16px;
}

.conversations-placeholder {
    text-align: center;
    padding: 40px;
    color: #666;
}

@media (max-width: 768px) {
    .gary-ai-charts-section {
        grid-template-columns: 1fr;
    }
}
</style>
