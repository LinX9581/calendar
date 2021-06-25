
// å–æ¶ˆåˆ†é¡ž
$('.selection-item>ul>li .btn-remove').click(function (e) {

    e.preventDefault();
    $(this).parents('.selection-item>ul>li').fadeOut(300, function () {
        $(this).remove();
    });
});

// æœˆæ›†
$(function () {
    // Datepicker

    $.datepicker.regional['zh-TW'] = {
        clearText: 'æ¸…é™¤', clearStatus: 'æ¸…é™¤å·²é¸æ—¥æœŸ',
        closeText: 'é—œé–‰', closeStatus: 'å–æ¶ˆé¸æ“‡',
        prevText: '<ä¸Šä¸€æœˆ', prevStatus: 'é¡¯ç¤ºä¸Šå€‹æœˆ',
        nextText: 'ä¸‹ä¸€æœˆ>', nextStatus: 'é¡¯ç¤ºä¸‹å€‹æœˆ',
        currentText: 'ä»Šå¤©', currentStatus: 'é¡¯ç¤ºæœ¬æœˆ',
        monthNames: ['ä¸€æœˆ', 'äºŒæœˆ', 'ä¸‰æœˆ', 'å››æœˆ', 'äº”æœˆ', 'å…­æœˆ',
            'ä¸ƒæœˆ', 'å…«æœˆ', 'ä¹æœˆ', 'åæœˆ', 'åä¸€æœˆ', 'åäºŒæœˆ'],
        monthNamesShort: ['ä¸€', 'äºŒ', 'ä¸‰', 'å››', 'äº”', 'å…­',
            'ä¸ƒ', 'å…«', 'ä¹', 'å', 'åä¸€', 'åäºŒ'],
        monthStatus: 'é¸æ“‡æœˆä»½', yearStatus: 'é¸æ“‡å¹´ä»½',
        weekHeader: 'å‘¨', weekStatus: '',
        dayNames: ['æ˜ŸæœŸæ—¥', 'æ˜ŸæœŸä¸€', 'æ˜ŸæœŸäºŒ', 'æ˜ŸæœŸä¸‰', 'æ˜ŸæœŸå››', 'æ˜ŸæœŸäº”', 'æ˜ŸæœŸå…­'],
        dayNamesShort: ['å‘¨æ—¥', 'å‘¨ä¸€', 'å‘¨äºŒ', 'å‘¨ä¸‰', 'å‘¨å››', 'å‘¨äº”', 'å‘¨å…­'],
        dayNamesMin: ['æ—¥', 'ä¸€', 'äºŒ', 'ä¸‰', 'å››', 'äº”', 'å…­'],
        dayStatus: 'è¨­å®šæ¯å‘¨ç¬¬ä¸€å¤©', dateStatus: 'é¸æ“‡ mæœˆ dæ—¥, DD',
        dateFormat: 'yy-mm-dd', firstDay: 1,
        initStatus: 'è«‹é¸æ“‡æ—¥æœŸ', isRTL: false
    };
    $(".datepicker").datepicker();
    $.datepicker.setDefaults($.datepicker.regional['zh-TW']);
});


// datatables
$(document).ready(function () {
    
    var table = $('.table').DataTable({
        scrollY: "500px",
        scrollX: true,
        scrollCollapse: true,
        paging: false,
        searching: false,
        info: false,
        ordering: false,
        fixedColumns: {
            leftColumns: 1,
        }
    });
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        $($.fn.dataTable.tables(true)).DataTable()
            .columns.adjust()
            .responsive.recalc()
    });
});

$('.nav-tabs').scrollingTabs({
    bootstrapVersion: 4,
    scrollToTabEdge: true,
    enableSwiping: true,
    disableScrollArrowsOnFullyScrolled: true,
    cssClassLeftArrow: 'fa fa-chevron-left',
    cssClassRightArrow: 'fa fa-chevron-right'
});
