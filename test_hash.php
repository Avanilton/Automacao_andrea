<?php
echo "admin123: " . (password_verify('admin123', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi') ? 'yes' : 'no') . "\n";
echo "password: " . (password_verify('password', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi') ? 'yes' : 'no') . "\n";
echo "admin123 hash: " . password_hash('admin123', PASSWORD_DEFAULT) . "\n";
?>
