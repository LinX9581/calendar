# 常用指令
# 取得特定委刊單相依的廣告版位
SELECT `calendar_list`.`name`,`start`,`end` FROM `schedule_event` INNER JOIN `calendar_list` ON `calendar_list`.`id` = `schedule_event`.`calendarId` WHERE orderId = '14'
# 取得確定委刊的版位
SELECT calendarId FROM sale_booking.schedule_event INSERT JOIN sale_booking.order_list ON schedule_event.orderId = order_list.id WHERE order_list.status = 2

# 取得啟用委刊的輪替數
SELECT count(*) AS adNumbers FROM sale_booking.`order_list` INNER JOIN sale_booking.`schedule_event` ON `order_list`.`id` = `schedule_event`.`orderId` WHERE calendarId = '1628760939140' `order_list`.status = 2

# 匯入一筆calendar_list
INSERT INTO calendar_list(id,name,color,bgcolor,dragbgcolor,bordercolor) VALUES('1','test','#ffffff','black','black','black');

# 匯入一個作者
INSERT INTO `user` (`id`, `account`, `password`, `type`, `name`, `email`, `memo`, `status`, `create_date`, `create_by`, `update_date`, `update_by`) VALUES (NULL, 'linxx', 'b7d8f291e712376db043f1127944f3f0x', 'admin', 'lin+x', 'linfornxn@gmail.com', '鍵盤俠', '0', '2021-06-25 19:03:00', 'linxx', '2021-06-25 19:03:00', 'linxx')

# 更改委刊單的作者
update sale_booking.order_list set create_by='brian',update_by='brian' where id=8;

