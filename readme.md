# 常用指令
* 取得特定委刊單相依的廣告版位
SELECT `calendar_list`.`name`,`start`,`end` FROM `schedule_event` INNER JOIN `calendar_list` ON `calendar_list`.`id` = `schedule_event`.`calendarId` WHERE orderId = '14'

INSERT INTO calendar_list(id,name,color,bgcolor,dragbgcolor,bordercolor)
VALUES('1','test','#ffffff','black','black','black');

INSERT INTO `user` (`id`, `account`, `password`, `type`, `name`, `email`, `memo`, `status`, `create_date`, `create_by`, `update_date`, `update_by`) VALUES (NULL, 'linxx', 'b7d8f291e712376db043f1127944f3f0x', 'admin', 'lin+x', 'linfornxn@gmail.com', '鍵盤俠', '0', '2021-06-25 19:03:00', 'linxx', '2021-06-25 19:03:00', 'linxx')

update sale_booking.order_list set create_by='brian',update_by='brian' where id=8;

test

https://www.itread01.com/content/1547092477.html