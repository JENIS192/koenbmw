// All tables are created automatically on first start (idempotent).
const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(40) NULL,
    role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    brand VARCHAR(40) NOT NULL,
    tagline VARCHAR(255) NULL,
    description TEXT NULL,
    accent VARCHAR(20) NOT NULL DEFAULT '#4aa3df',
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    brand VARCHAR(60) NOT NULL,
    model VARCHAR(120) NOT NULL,
    year SMALLINT NOT NULL,
    price DECIMAL(14,2) NOT NULL,
    mileage INT NOT NULL DEFAULT 0,
    fuel VARCHAR(30) NOT NULL DEFAULT 'Petrol',
    transmission VARCHAR(40) NOT NULL DEFAULT 'Automatic',
    horsepower INT NULL,
    top_speed INT NULL,
    acceleration DECIMAL(4,1) NULL,
    color VARCHAR(60) NULL,
    description TEXT NULL,
    stock INT NOT NULL DEFAULT 1,
    featured TINYINT(1) NOT NULL DEFAULT 0,
    status ENUM('available','sold') NOT NULL DEFAULT 'available',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vehicles_department (department_id),
    INDEX idx_vehicles_status (status),
    CONSTRAINT fk_vehicles_department FOREIGN KEY (department_id) REFERENCES departments(id)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS vehicle_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    is_primary TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_images_vehicle (vehicle_id),
    CONSTRAINT fk_images_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cart (user_id, vehicle_id),
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_wishlist (user_id, vehicle_id),
    CONSTRAINT fk_wish_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_wish_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(40) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    total DECIMAL(14,2) NOT NULL,
    status ENUM('pending','confirmed','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(40) NOT NULL,
    shipping_name VARCHAR(120) NOT NULL,
    shipping_phone VARCHAR(40) NOT NULL,
    shipping_address VARCHAR(255) NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_country VARCHAR(100) NOT NULL,
    notes VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_orders_user (user_id),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    vehicle_name VARCHAR(200) NOT NULL,
    price DECIMAL(14,2) NOT NULL,
    INDEX idx_items_order (order_id),
    CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_items_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    vehicle_id INT NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,
    phone VARCHAR(40) NULL,
    type ENUM('test_drive','enquiry','sell_car') NOT NULL DEFAULT 'enquiry',
    preferred_date DATE NULL,
    message TEXT NOT NULL,
    status ENUM('new','contacted','closed') NOT NULL DEFAULT 'new',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inq_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_inq_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT NOT NULL,
    comment VARCHAR(800) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_review (vehicle_id, user_id),
    CONSTRAINT fk_rev_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rev_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`,
];

async function createTables(pool) {
  for (const sql of statements) {
    await pool.query(sql);
  }
  console.log(`📦 Database tables ready (${statements.length} tables)`);
}

module.exports = { createTables };
