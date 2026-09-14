-- =====================================================================
-- DATABASE SCHEMA & INITIAL MOCK DATA
-- Database Name: homef4fw_homefaci
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `homef4fw_homefaci`;
USE `homef4fw_homefaci`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `mobile` VARCHAR(20) NOT NULL,
  `address` TEXT NOT NULL,
  `createdAt` VARCHAR(100) NOT NULL DEFAULT '15-05-2026'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `users` (`id`, `name`, `email`, `mobile`, `address`, `createdAt`) VALUES
(1, 'Rahul Sharma', 'rahul@gmail.com', '9876543210', 'Delhi, India', '15-05-2026'),
(2, 'Aman Verma', 'aman@gmail.com', '9988776655', 'Jaipur, Rajasthan', '18-05-2026'),
(3, 'Neha Singh', 'neha@gmail.com', '9123456780', 'Noida, Uttar Pradesh', '20-05-2026');

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `parent` VARCHAR(255) NOT NULL,
  `image` VARCHAR(500) NOT NULL,
  `status` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `categories` (`id`, `title`, `parent`, `image`, `status`) VALUES
(1, 'Cleaning', 'None', 'https://cdn-icons-png.flaticon.com/512/3130/3130282.png', 1),
(2, 'Sofa Cleaning', 'Cleaning', 'https://cdn-icons-png.flaticon.com/512/2413/2413728.png', 1),
(3, 'Repairing', 'None', 'https://cdn-icons-png.flaticon.com/512/2933/2933245.png', 1);

-- 3. Services Table
CREATE TABLE IF NOT EXISTS `services` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `image` VARCHAR(500) NOT NULL,
  `description` TEXT NOT NULL,
  `status` TINYINT(1) NOT NULL DEFAULT 1,
  `category_id` INT DEFAULT NULL,
  CONSTRAINT `services_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `services` (`id`, `title`, `price`, `image`, `description`, `status`, `category_id`) VALUES
(1, 'AC Repair', 499.00, 'https://cdn-icons-png.flaticon.com/512/2933/2933245.png', 'Professional AC repair service for home and office.', 1, 3),
(2, 'Plumbing', 299.00, 'https://cdn-icons-png.flaticon.com/512/1684/1684375.png', 'Complete plumbing solution including leakage fixing.', 1, 3),
(3, 'Electrician', 399.00, 'https://cdn-icons-png.flaticon.com/512/942/942748.png', 'Electric fitting and repair service.', 0, 3);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `serviceRequestNumber` VARCHAR(100) NOT NULL,
  `serviceName` VARCHAR(255) NOT NULL,
  `serviceAmount` DECIMAL(10, 2) NOT NULL,
  `slotTime` VARCHAR(100) NOT NULL,
  `serviceDate` VARCHAR(100) NOT NULL,
  `city` VARCHAR(255) NOT NULL,
  `locality` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `vendorName` VARCHAR(255) NOT NULL,
  `address` TEXT NOT NULL,
  `createdAt` VARCHAR(100) NOT NULL,
  `paymentMethod` VARCHAR(100) NOT NULL DEFAULT 'UPI'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `orders` (`id`, `serviceRequestNumber`, `serviceName`, `serviceAmount`, `slotTime`, `serviceDate`, `city`, `locality`, `status`, `vendorName`, `address`, `createdAt`) VALUES
(1, 'REQ1001', 'Sofa Cleaning', 599.00, '10:00 AM - 12:00 PM', '15-05-2026', 'Delhi', 'Connaught Place', 'Pending', 'Govind', 'H.No 12, Block B, CP, New Delhi', '14-05-2026 04:30 PM'),
(2, 'REQ1002', 'AC Repair', 499.00, '02:00 PM - 04:00 PM', '16-05-2026', 'Jaipur', 'Malviya Nagar', 'Assigned', 'Mahesh Kumar', '45, Gali 2, Malviya Nagar, Jaipur', '15-05-2026 10:15 AM'),
(3, 'REQ1003', 'Deep House Cleaning', 1999.00, '09:00 AM - 01:00 PM', '12-05-2026', 'Noida', 'Sector 62', 'Completed', 'Govind', 'Flat 402, Tower T2, Sector 62, Noida', '11-05-2026 01:00 PM'),
(4, 'REQ1004', 'Fan Repairing', 150.00, '04:00 PM - 05:00 PM', '10-05-2026', 'Delhi', 'Dwarka Sector 10', 'Cancelled', '-', 'Pocket 1, Sector 10, Dwarka, Delhi', '10-05-2026 09:00 AM');

-- 5. Pages Table
CREATE TABLE IF NOT EXISTS `pages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `pages` (`id`, `title`, `description`) VALUES
(1, 'About Us', 'We provide the best on-demand home services including cleaning, plumbing, AC repair, and electrical work right at your doorstep.'),
(2, 'Terms and Conditions', 'Please read these terms carefully. By using our services you agree to comply with all safety and payment guidelines.'),
(3, 'Privacy Policy', 'We value your privacy. We collect your location and contact details only to provide services and we never share them with third parties.');

-- 6. Partners Table
CREATE TABLE IF NOT EXISTS `partners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `mobile` VARCHAR(20) NOT NULL,
  `city` VARCHAR(255) NOT NULL,
  `state` VARCHAR(255) NOT NULL,
  `locality` VARCHAR(255) NOT NULL,
  `address` TEXT NOT NULL,
  `image` VARCHAR(500) NOT NULL,
  `status` TINYINT(1) NOT NULL DEFAULT 1,
  `isApproved` TINYINT(1) NOT NULL DEFAULT 0,
  `gender` VARCHAR(20) NOT NULL,
  `experience` VARCHAR(100) NOT NULL,
  `services` TEXT NOT NULL, -- Comma-separated list of services
  `aadhaarNumber` VARCHAR(50) NOT NULL,
  `panNumber` VARCHAR(50) NOT NULL,
  `bankName` VARCHAR(255) NOT NULL,
  `accountNumber` VARCHAR(50) NOT NULL,
  `ifscCode` VARCHAR(50) NOT NULL,
  `documents` TEXT NOT NULL, -- Comma-separated document paths/names
  `walletBalance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `totalEarnings` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `withdrawnAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `payToCompany` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `totalBookings` INT NOT NULL DEFAULT 0,
  `completedBookings` INT NOT NULL DEFAULT 0,
  `cancelledBookings` INT NOT NULL DEFAULT 0,
  `pendingBookings` INT NOT NULL DEFAULT 0,
  `rating` DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
  `totalReviews` INT NOT NULL DEFAULT 0,
  `createdAt` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `partners` (`id`, `name`, `email`, `mobile`, `city`, `state`, `locality`, `address`, `image`, `status`, `isApproved`, `gender`, `experience`, `services`, `aadhaarNumber`, `panNumber`, `bankName`, `accountNumber`, `ifscCode`, `documents`, `walletBalance`, `totalEarnings`, `withdrawnAmount`, `totalBookings`, `completedBookings`, `cancelledBookings`, `pendingBookings`, `rating`, `totalReviews`, `createdAt`) VALUES
(1, 'Govind', 'govind@gmail.com', '9876543201', 'Delhi', 'Delhi', 'Connaught Place', 'H.No 12, CP, Delhi', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 1, 1, 'Male', '5 Years', 'Cleaning,Sofa Cleaning', '123456789012', 'ABCDE1234F', 'State Bank of India', '30291827361', 'SBIN0001234', 'aadhaar.pdf,pan.jpg', 1500.00, 25000.00, 23500.00, 45, 42, 2, 1, 4.8, 12, '01-04-2026'),
(2, 'Mahesh Kumar', 'mahesh@gmail.com', '9988776601', 'Jaipur', 'Rajasthan', 'Malviya Nagar', '45, Malviya Nagar, Jaipur', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 1, 0, 'Male', '3 Years', 'AC Repair,Electrician', '987654321098', 'XYZWV9876A', 'HDFC Bank', '50100987654', 'HDFC0000123', 'aadhaar.pdf', 0.00, 0.00, 0.00, 0, 0, 0, 0, 0.0, 0, '15-05-2026');

-- 7. Booking Earnings Table
CREATE TABLE IF NOT EXISTS `booking_earnings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transactionId` VARCHAR(100) NOT NULL,
  `serviceAmount` DECIMAL(10, 2) NOT NULL,
  `paymentMethod` VARCHAR(100) NOT NULL,
  `extraServiceAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `extraServicePaymentMethod` VARCHAR(100) NOT NULL,
  `totalAmount` DECIMAL(10, 2) NOT NULL,
  `orderDate` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `booking_earnings` (`id`, `transactionId`, `serviceAmount`, `paymentMethod`, `extraServiceAmount`, `extraServicePaymentMethod`, `totalAmount`, `orderDate`) VALUES
(1, 'TXN1001', 500.00, 'UPI', 100.00, 'Cash', 600.00, '11-05-2026'),
(2, 'TXN1002', 800.00, 'Cash', 0.00, '-', 800.00, '10-05-2026'),
(3, 'TXN1003', 1200.00, 'Card', 200.00, 'UPI', 1400.00, '09-05-2026');

-- 8. Subscription Earnings Table
CREATE TABLE IF NOT EXISTS `subscription_earnings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `partnerName` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `paymentMethod` VARCHAR(100) NOT NULL,
  `purchaseDate` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `subscription_earnings` (`id`, `partnerName`, `amount`, `paymentMethod`, `purchaseDate`, `status`) VALUES
(1, 'Govind', 100.00, 'UPI', '12-05-2026', 'Paid'),
(2, 'Mahesh Kumar', 100.00, 'UPI', '13-05-2026', 'Paid');

-- 9. Banners Table
CREATE TABLE IF NOT EXISTS `banners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `image` VARCHAR(500) NOT NULL,
  `status` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `banners` (`id`, `title`, `image`, `status`) VALUES
(1, 'Super Summer Offer', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d', 1),
(2, 'Monsoon Cleaning Package', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952', 1),
(3, 'Diwali Special AC Servicing', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e', 0);

-- 10. States Table
CREATE TABLE IF NOT EXISTS `states` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `status` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `states` (`id`, `name`, `status`) VALUES
(1, 'Delhi', 1),
(2, 'Rajasthan', 1),
(3, 'Uttar Pradesh', 1),
(4, 'Haryana', 0);

-- 11. Cities Table
CREATE TABLE IF NOT EXISTS `cities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cityName` VARCHAR(255) NOT NULL,
  `stateName` VARCHAR(255) NOT NULL,
  `status` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `cities` (`id`, `cityName`, `stateName`, `status`) VALUES
(1, 'New Delhi', 'Delhi', 1),
(2, 'Jaipur', 'Rajasthan', 1),
(3, 'Noida', 'Uttar Pradesh', 1),
(4, 'Gurugram', 'Haryana', 0);

-- 12. Localities Table
CREATE TABLE IF NOT EXISTS `localities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `localityName` VARCHAR(255) NOT NULL,
  `cityName` VARCHAR(255) NOT NULL,
  `stateName` VARCHAR(255) NOT NULL,
  `status` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `localities` (`id`, `localityName`, `cityName`, `stateName`, `status`) VALUES
(1, 'Connaught Place', 'New Delhi', 'Delhi', 1),
(2, 'Dwarka Sector 10', 'New Delhi', 'Delhi', 1),
(3, 'Malviya Nagar', 'Jaipur', 'Rajasthan', 1),
(4, 'Sector 62', 'Noida', 'Uttar Pradesh', 1),
(5, 'Sohna Road', 'Gurugram', 'Haryana', 0);

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `audience` VARCHAR(100) NOT NULL,
  `createdAt` VARCHAR(100) NOT NULL,
  `status` TINYINT(1) NOT NULL DEFAULT 1,
  `isSent` TINYINT(1) NOT NULL DEFAULT 0,
  `sentAt` VARCHAR(100) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `notifications` (`id`, `title`, `message`, `audience`, `createdAt`, `status`, `isSent`, `sentAt`) VALUES
(1, 'Welcome Offer!', 'Get flat 20% off on your first sofa cleaning service using code FIRST20.', 'All Users', '12-05-2026 10:00 AM', 1, 1, '12-05-2026 10:05 AM'),
(2, 'Verification Required', 'Please complete your KYC by uploading Aadhaar and PAN cards to start receiving bookings.', 'All Partners', '14-05-2026 09:00 AM', 1, 0, '');

-- 14. Reviews Table
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userName` VARCHAR(255) NOT NULL,
  `partnerName` VARCHAR(255) NOT NULL,
  `serviceName` VARCHAR(255) NOT NULL,
  `rating` DECIMAL(3, 2) NOT NULL,
  `reviewText` TEXT NOT NULL,
  `status` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `reviews` (`id`, `userName`, `partnerName`, `serviceName`, `rating`, `reviewText`, `status`) VALUES
(1, 'Rahul Sharma', 'Govind', 'Deep House Cleaning', 5.00, 'Excellent service, Govind was very polite and thorough with his work. Highly recommended!', 1),
(2, 'Aman Verma', 'Mahesh Kumar', 'AC Repair', 4.00, 'Fixed the AC cooling issue, work was good but arrived 30 mins late.', 1),
(3, 'Sneha Patel', 'Govind', 'Sofa Cleaning', 4.50, 'Cleaned all the stains, very good service.', 0);

-- 15. Settings Config Table
CREATE TABLE IF NOT EXISTS `settings_config` (
  `key` VARCHAR(255) PRIMARY KEY,
  `value` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `settings_config` (`key`, `value`) VALUES
('commission_rate', '10')
ON DUPLICATE KEY UPDATE `value`=`value`;

-- 16. Support Tickets Table
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userName` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `mobile` VARCHAR(20) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Open',
  `createdAt` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `support_tickets` (`id`, `userName`, `email`, `mobile`, `subject`, `message`, `status`, `createdAt`) VALUES
(1, 'Rahul Sharma', 'rahul@gmail.com', '9876543210', 'AC not cooling after repair', 'The technician Govind repaired my AC yesterday, but it is still not cooling properly. Please help.', 'Open', '29-05-2026'),
(2, 'Aman Verma', 'aman@gmail.com', '9988776655', 'Refund status for cancellation', 'I cancelled my Sofa Cleaning request REQ1004. When will I get my refund?', 'Closed', '28-05-2026');
