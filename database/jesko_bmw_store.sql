/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `jesko_bmw_store` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `jesko_bmw_store`;
DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cart` (`user_id`,`vehicle_id`),
  KEY `fk_cart_vehicle` (`vehicle_id`),
  CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `brand` varchar(40) NOT NULL,
  `tagline` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `accent` varchar(20) NOT NULL DEFAULT '#4aa3df',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Koenigsegg Hypercars','koenigsegg-hypercars','Koenigsegg','Swedish hypercars built without compromise','Jesko Absolut, Gemera, Regera and more. Hand-built carbon fibre hypercars with record-breaking engineering.','#c9ced4',1);
INSERT INTO `departments` VALUES (2,'BMW M Performance','bmw-m-performance','BMW','Track-bred BMW M power for the road','M3, M4, M5 and M8 models tuned by BMW M GmbH for pure driving feel.','#0166b1',2);
INSERT INTO `departments` VALUES (3,'BMW Luxury Sedans','bmw-luxury-sedans','BMW','Executive comfort with sporting character','The 3, 5 and 7 Series. Refined interiors, advanced technology and effortless long-distance comfort.','#53a8e2',3);
INSERT INTO `departments` VALUES (4,'BMW SUV and X Models','bmw-suv-x','BMW','Space, presence and all-road capability','From the X3 to the XM. Family-ready SUVs with real performance credentials.','#e4002b',4);
INSERT INTO `departments` VALUES (5,'BMW Electric (i)','bmw-electric','BMW','Fully electric BMW driving pleasure','i4, i5, i7 and iX. Zero tailpipe emissions with rapid charging and instant torque.','#2fb67c',5);
INSERT INTO `departments` VALUES (6,'BMW Classics','bmw-classics','BMW','Collectible BMW icons','Carefully inspected, collector-grade BMWs from the golden era of the brand.','#c8963e',6);
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `inquiries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inquiries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `vehicle_id` int(11) DEFAULT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(180) NOT NULL,
  `phone` varchar(40) DEFAULT NULL,
  `type` enum('test_drive','enquiry','sell_car') NOT NULL DEFAULT 'enquiry',
  `preferred_date` date DEFAULT NULL,
  `message` text NOT NULL,
  `status` enum('new','contacted','closed') NOT NULL DEFAULT 'new',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_inq_user` (`user_id`),
  KEY `fk_inq_vehicle` (`vehicle_id`),
  CONSTRAINT `fk_inq_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inq_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `inquiries` WRITE;
/*!40000 ALTER TABLE `inquiries` DISABLE KEYS */;
/*!40000 ALTER TABLE `inquiries` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `vehicle_name` varchar(200) NOT NULL,
  `price` decimal(14,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_items_order` (`order_id`),
  KEY `fk_items_vehicle` (`vehicle_id`),
  CONSTRAINT `fk_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_items_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_number` varchar(40) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total` decimal(14,2) NOT NULL,
  `status` enum('pending','confirmed','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  `payment_method` varchar(40) NOT NULL,
  `shipping_name` varchar(120) NOT NULL,
  `shipping_phone` varchar(40) NOT NULL,
  `shipping_address` varchar(255) NOT NULL,
  `shipping_city` varchar(100) NOT NULL,
  `shipping_country` varchar(100) NOT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `idx_orders_user` (`user_id`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vehicle_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` tinyint(4) NOT NULL,
  `comment` varchar(800) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_review` (`vehicle_id`,`user_id`),
  KEY `fk_rev_user` (`user_id`),
  CONSTRAINT `fk_rev_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rev_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `email` varchar(180) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(40) DEFAULT NULL,
  `role` enum('customer','admin') NOT NULL DEFAULT 'customer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Store Admin','admin@jeskobmw.com','$2a$10$tmAusofYG/gJtUtp1ZWW9.Uz/LzNxXU9octMGKSibrsyLe5NGyQ4O',NULL,'admin','2026-10-24 06:22:31');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `vehicle_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vehicle_id` int(11) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_images_vehicle` (`vehicle_id`),
  CONSTRAINT `fk_images_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `vehicle_images` WRITE;
/*!40000 ALTER TABLE `vehicle_images` DISABLE KEYS */;
INSERT INTO `vehicle_images` VALUES (1,1,'/uploads/seed-1-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (2,1,'/uploads/seed-1-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (3,1,'/uploads/seed-1-3.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (4,2,'/uploads/seed-2-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (5,2,'/uploads/seed-2-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (6,2,'/uploads/seed-2-3.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (7,3,'/uploads/seed-3-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (8,3,'/uploads/seed-3-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (9,3,'/uploads/seed-3-3.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (10,4,'/uploads/seed-4-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (11,4,'/uploads/seed-4-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (12,4,'/uploads/seed-4-3.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (13,5,'/uploads/seed-5-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (14,5,'/uploads/seed-5-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (15,5,'/uploads/seed-5-3.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (16,6,'/uploads/seed-6-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (17,6,'/uploads/seed-6-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (18,6,'/uploads/seed-6-3.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (19,7,'/uploads/seed-7-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (20,7,'/uploads/seed-7-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (21,7,'/uploads/seed-7-3.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (22,8,'/uploads/seed-8-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (23,8,'/uploads/seed-8-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (24,8,'/uploads/seed-8-3.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (25,9,'/uploads/seed-9-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (26,9,'/uploads/seed-9-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (27,9,'/uploads/seed-9-3.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (28,10,'/uploads/seed-10-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (29,10,'/uploads/seed-10-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (30,10,'/uploads/seed-10-3.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (31,11,'/uploads/seed-11-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (32,11,'/uploads/seed-11-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (33,11,'/uploads/seed-11-3.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (34,12,'/uploads/seed-12-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (35,12,'/uploads/seed-12-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (36,12,'/uploads/seed-12-3.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (37,13,'/uploads/seed-13-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (38,13,'/uploads/seed-13-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (39,13,'/uploads/seed-13-3.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (40,14,'/uploads/seed-14-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (41,14,'/uploads/seed-14-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (42,14,'/uploads/seed-14-3.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (43,15,'/uploads/seed-15-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (44,15,'/uploads/seed-15-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (45,15,'/uploads/seed-15-3.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (46,16,'/uploads/seed-16-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (47,16,'/uploads/seed-16-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (48,16,'/uploads/seed-16-3.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (49,17,'/uploads/seed-17-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (50,17,'/uploads/seed-17-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (51,17,'/uploads/seed-17-3.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (52,18,'/uploads/seed-18-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (53,18,'/uploads/seed-18-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (54,18,'/uploads/seed-18-3.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (55,19,'/uploads/seed-19-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (56,19,'/uploads/seed-19-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (57,19,'/uploads/seed-19-3.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (58,20,'/uploads/seed-20-1.svg',1,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (59,20,'/uploads/seed-20-2.svg',0,'2026-10-24 06:22:31');
INSERT INTO `vehicle_images` VALUES (60,20,'/uploads/seed-20-3.svg',0,'2026-10-24 06:22:31');
/*!40000 ALTER TABLE `vehicle_images` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `department_id` int(11) NOT NULL,
  `brand` varchar(60) NOT NULL,
  `model` varchar(120) NOT NULL,
  `year` smallint(6) NOT NULL,
  `price` decimal(14,2) NOT NULL,
  `mileage` int(11) NOT NULL DEFAULT 0,
  `fuel` varchar(30) NOT NULL DEFAULT 'Petrol',
  `transmission` varchar(40) NOT NULL DEFAULT 'Automatic',
  `horsepower` int(11) DEFAULT NULL,
  `top_speed` int(11) DEFAULT NULL,
  `acceleration` decimal(4,1) DEFAULT NULL,
  `color` varchar(60) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 1,
  `featured` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('available','sold') NOT NULL DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_vehicles_department` (`department_id`),
  KEY `idx_vehicles_status` (`status`),
  CONSTRAINT `fk_vehicles_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `vehicles` WRITE;
/*!40000 ALTER TABLE `vehicles` DISABLE KEYS */;
INSERT INTO `vehicles` VALUES (1,1,'Koenigsegg','Jesko Absolut',2025,3400000.00,120,'Petrol (E85)','9-speed Light Speed Transmission',1600,531,2.5,'Ghost White','The pursuit of the highest top speed ever. The Jesko Absolut trades downforce for a slippery 0.278 Cd body and a 5.0L twin-turbo V8 that makes 1,600 hp on E85. Hand-built in Angelholm, Sweden.',1,1,'available','2026-10-24 06:22:31');
INSERT INTO `vehicles` VALUES (2,1,'Koenigsegg','Jesko Attack',2024,3100000.00,340,'Petrol (E85)','9-speed Light Speed Transmission',1600,483,2.5,'Carbon Black','The track-focused sibling with 1,000 kg of downforce at 250 km/h. Giant rear wing, triplex suspension and a cockpit built around the driver.',1,1,'available','2026-10-24 06:22:31');
INSERT INTO `vehicles` VALUES (3,1,'Koenigsegg','Gemera',2025,1950000.00,60,'Hybrid','Koenigsegg Direct Drive',1700,400,1.9,'Arctic Silver','The world first Mega-GT: four seats, four electric motors and the 2.0L Tiny Friendly Giant three-cylinder engine delivering 1,700 hp.',1,1,'available','2026-10-24 06:22:31');
INSERT INTO `vehicles` VALUES (4,1,'Koenigsegg','Regera',2022,2800000.00,1800,'Hybrid','Direct Drive (single speed)',1500,410,2.8,'Pearl Blue','Gearbox-free hybrid hypercar with a twin-turbo V8 and three electric motors. Famous for its sequential power delivery and luxury cabin.',1,0,'available','2026-10-24 06:22:31');
INSERT INTO `vehicles` VALUES (5,1,'Koenigsegg','CC850',2024,3650000.00,90,'Petrol','6-speed manual with 9-speed engagement',1385,440,2.7,'Sunburst Orange','A tribute to the original CC8S with a unique Engage Shift System: a true manual gearbox and a paddle-shift automatic in one car.',1,0,'available','2026-10-24 06:22:31');
INSERT INTO `vehicles` VALUES (6,2,'BMW','M3 Competition xDrive',2024,94000.00,4200,'Petrol','8-speed M Steptronic',503,290,3.4,'Isle of Man Green','Twin-turbo inline-six, M xDrive with rear-biased handling and carbon-fibre roof. The benchmark sports sedan, ready for road or track days.',1,1,'available','2026-10-24 06:22:31');
INSERT INTO `vehicles` VALUES (7,2,'BMW','M4 CSL',2023,165000.00,2100,'Petrol','8-speed M Steptronic',543,307,3.6,'Brooklyn Grey','Limited production, 100 kg lighter, with laser-light headlights and a stripped-out cabin. A Nurburgring-bred special.',1,1,'available','2026-10-24 06:22:31');
INSERT INTO `vehicles` VALUES (8,2,'BMW','M5 Competition',2023,112000.00,9800,'Petrol','8-speed M Steptronic',617,305,3.3,'Marina Bay Blue','A 4.4L twin-turbo V8 with all-wheel drive and a rear-drive mode. Executive-class comfort with supercar pace.',1,0,'available','2026-10-24 06:22:31');
INSERT INTO `vehicles` VALUES (9,2,'BMW','M8 Competition Coupe',2022,128000.00,11000,'Petrol','8-speed M Steptronic',617,305,3.2,'Frozen Black','Grand-touring muscle with M Carbon ceramic brakes and a beautifully appointed cabin. Fast, wide and unmistakable.',1,0,'available','2026-10-24 06:22:31');
INSERT INTO `vehicles` VALUES (10,3,'BMW','740i M Sport',2024,99000.00,3000,'Petrol','8-speed Steptronic',375,250,5.4,'Oxide Grey','Flagship luxury with a 31-inch Theatre Screen, Executive Lounge seating and a silky inline-six.',1,0,'available','2026-10-24 06:22:31');
INSERT INTO `vehicles` VALUES (11,3,'BMW','530i xDrive',2024,62000.00,5200,'Petrol','8-speed Steptronic',255,250,6.2,'Alpine White','The sweet-spot 5 Series with a curved display, driver assistance suite and a refined ride.',1,0,'available','2026-10-24 06:22:31');
INSERT INTO `vehicles` VALUES (12,3,'BMW','330i Sport Line',2023,46000.00,14000,'Petrol','8-speed Steptronic',255,250,5.6,'Portimao Blue','The compact executive sedan that defined the category. Balanced handling and everyday usability.',1,0,'available','2026-10-24 06:22:31');
INSERT INTO `vehicles` VALUES (13,4,'BMW','XM Label Red',2024,185000.00,1500,'Plug-in Hybrid','8-speed M Steptronic',738,290,3.8,'Marrakesh Brown','The most powerful BMW production car of its time: a V8 plug-in hybrid with bold design and a 2+3 lounge cabin.',1,1,'available','2026-10-24 06:22:31');
INSERT INTO `vehicles` VALUES (14,4,'BMW','X5 M Competition',2023,138000.00,8700,'Petrol','8-speed M Steptronic',617,290,3.7,'Carbon Black','Family SUV with a supercar heart: 4.4L twin-turbo V8, adaptive M suspension and big brakes.',1,0,'available','2026-10-24 06:22:31');
INSERT INTO `vehicles` VALUES (15,4,'BMW','X3 M40i',2024,68000.00,2400,'Petrol','8-speed Steptronic Sport',382,250,4.4,'Phytonic Blue','Compact SUV with an inline-six, sport brakes and an M Sport differential. The right size for daily life.',1,0,'available','2026-10-24 06:22:31');
INSERT INTO `vehicles` VALUES (16,5,'BMW','i7 xDrive60',2024,125000.00,2800,'Electric','Single speed',536,240,4.5,'Mineral White','Fully electric luxury limousine with a 101.7 kWh battery, rear-seat theatre and up to 600 km WLTP range.',1,1,'available','2026-10-24 06:22:31');
INSERT INTO `vehicles` VALUES (17,5,'BMW','iX M60',2024,111000.00,3300,'Electric','Single speed',610,250,3.8,'Storm Bay','M Performance electric SUV with 111.5 kWh battery, 195 kW DC fast charging and a crafted cabin.',1,0,'available','2026-10-24 06:22:31');
INSERT INTO `vehicles` VALUES (18,5,'BMW','i4 M50',2023,72000.00,7600,'Electric','Single speed',536,225,3.9,'Frozen Portimao Blue','The sporty electric Gran Coupe. Instant torque, a low centre of gravity and daily-usable range.',1,0,'available','2026-10-24 06:22:31');
INSERT INTO `vehicles` VALUES (19,6,'BMW','E30 M3 Sport Evolution',1990,285000.00,62000,'Petrol','5-speed manual',235,248,6.5,'Nogaro Silver','The legendary homologation special with a 2.5L S14 four-cylinder. Matching-numbers example with full documentation.',1,1,'available','2026-10-24 06:22:31');
INSERT INTO `vehicles` VALUES (20,6,'BMW','3.0 CSL Batmobile',1973,420000.00,71000,'Petrol','4-speed manual',206,220,7.0,'Polaris Silver','The aero-winged icon from BMW Motorsport history. Restored to concours standard with period-correct details.',1,0,'available','2026-10-24 06:22:31');
/*!40000 ALTER TABLE `vehicles` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `wishlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wishlist` (`user_id`,`vehicle_id`),
  KEY `fk_wish_vehicle` (`vehicle_id`),
  CONSTRAINT `fk_wish_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wish_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `wishlist` WRITE;
/*!40000 ALTER TABLE `wishlist` DISABLE KEYS */;
/*!40000 ALTER TABLE `wishlist` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

