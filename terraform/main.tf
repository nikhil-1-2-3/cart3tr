# =============================================================================
# QuickCart AWS Three-Tier Architecture - Complete Deployment
# 
# Architecture:
# - Presentation Tier : Vercel / CloudFront (React + Vite)
# - Application Tier  : AWS Application Load Balancer + Auto Scaling Group (EC2)
# - Database Tier     : Amazon RDS (MySQL 8.0 in Private Subnets)
# - Networking        : Custom VPC, 6 Subnets across 2 AZs, IGW, NAT Gateway
# =============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# -----------------------------------------------------------------------------
# 0. VARIABLES
# -----------------------------------------------------------------------------
variable "aws_region" {
  description = "AWS region to deploy QuickCart infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix used for resource naming"
  type        = string
  default     = "quickcart"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for the custom VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "instance_type" {
  description = "EC2 instance type for backend application tier"
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "Amazon RDS MySQL instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Database name for QuickCart"
  type        = string
  default     = "quickcart_db"
}

variable "db_username" {
  description = "Master username for Amazon RDS MySQL"
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "Master password for Amazon RDS MySQL (minimum 8 characters)"
  type        = string
  sensitive   = true
  default     = "Singh5322f"
}

variable "jwt_secret" {
  description = "Secret key for signing JSON Web Tokens in backend"
  type        = string
  sensitive   = true
  default     = "quickcart_secret_key_aws_3tier_2026"
}

variable "docker_image" {
  description = "Docker image for QuickCart backend (e.g. from Docker Hub or ECR). If empty, backend is cloned and built on-instance."
  type        = string
  default     = ""
}

variable "git_repo_url" {
  description = "Git repository URL for QuickCart source code (used if docker_image is empty)"
  type        = string
  default     = "https://github.com/nikhil-singh/quickcart.git"
}

variable "asg_min_size" {
  description = "Minimum number of backend EC2 instances"
  type        = number
  default     = 1
}

variable "asg_max_size" {
  description = "Maximum number of backend EC2 instances"
  type        = number
  default     = 3
}

variable "asg_desired_capacity" {
  description = "Desired number of backend EC2 instances (spanned across 2 AZs)"
  type        = number
  default     = 2
}

# -----------------------------------------------------------------------------
# 1. PROVIDER & DATA SOURCES
# -----------------------------------------------------------------------------
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Fetch available Availability Zones in the selected AWS region
data "aws_availability_zones" "available" {
  state = "available"
}

# Fetch latest official Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# -----------------------------------------------------------------------------
# 2. NETWORKING TIER (VPC, 6 Subnets across 2 AZs, IGW, NAT Gateway)
# -----------------------------------------------------------------------------

# Custom VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Internet Gateway for Public Traffic (ALB & NAT Gateway outbound)
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# 2 Public Subnets (Tier 1 / ALB & NAT)
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet-1"
    Type = "Public"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet-2"
    Type = "Public"
  }
}

# 2 Private Application Subnets (Tier 2 / EC2 Backend ASG)
resource "aws_subnet" "private_app_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.11.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = false

  tags = {
    Name = "${var.project_name}-private-app-subnet-1"
    Type = "PrivateApp"
  }
}

resource "aws_subnet" "private_app_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.12.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = false

  tags = {
    Name = "${var.project_name}-private-app-subnet-2"
    Type = "PrivateApp"
  }
}

# 2 Private Database Subnets (Tier 3 / Amazon RDS MySQL Multi-AZ)
resource "aws_subnet" "private_db_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.21.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = false

  tags = {
    Name = "${var.project_name}-private-db-subnet-1"
    Type = "PrivateDB"
  }
}

resource "aws_subnet" "private_db_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.22.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = false

  tags = {
    Name = "${var.project_name}-private-db-subnet-2"
    Type = "PrivateDB"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain     = "vpc"
  depends_on = [aws_internet_gateway.igw]

  tags = {
    Name = "${var.project_name}-nat-eip"
  }
}

# NAT Gateway (placed in Public Subnet 1 so private EC2s can pull Docker & updates)
resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_1.id
  depends_on    = [aws_internet_gateway.igw]

  tags = {
    Name = "${var.project_name}-nat-gw"
  }
}

# Route Table for Public Subnets (Direct route to IGW)
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

# Route Table for Private Application Subnets (Route to NAT Gateway)
resource "aws_route_table" "private_app" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }

  tags = {
    Name = "${var.project_name}-private-app-rt"
  }
}

resource "aws_route_table_association" "private_app_1" {
  subnet_id      = aws_subnet.private_app_1.id
  route_table_id = aws_route_table.private_app.id
}

resource "aws_route_table_association" "private_app_2" {
  subnet_id      = aws_subnet.private_app_2.id
  route_table_id = aws_route_table.private_app.id
}

# Route Table for Private Database Subnets (Completely isolated, local VPC routing only)
resource "aws_route_table" "private_db" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-private-db-rt"
  }
}

resource "aws_route_table_association" "private_db_1" {
  subnet_id      = aws_subnet.private_db_1.id
  route_table_id = aws_route_table.private_db.id
}

resource "aws_route_table_association" "private_db_2" {
  subnet_id      = aws_subnet.private_db_2.id
  route_table_id = aws_route_table.private_db.id
}

# -----------------------------------------------------------------------------
# 3. SECURITY GROUPS (Strict 3-Tier Security Chaining)
# -----------------------------------------------------------------------------

# 1. ALB Security Group: Inbound Port 80 from anywhere, outbound to Backend EC2
resource "aws_security_group" "alb_sg" {
  name        = "${var.project_name}-alb-sg"
  description = "Allows incoming HTTP traffic from the internet to ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Allow HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow outbound traffic to backend EC2 instances"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-alb-sg"
  }
}

# 2. Application EC2 Security Group: Inbound Port 5001 ONLY from ALB SG
resource "aws_security_group" "app_sg" {
  name        = "${var.project_name}-app-sg"
  description = "Allows incoming traffic from ALB on port 5001 only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Allow backend port 5001 from ALB Security Group only"
    from_port       = 5001
    to_port         = 5001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    description = "Allow all outbound (for NAT Gateway, Docker registry, RDS)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-app-sg"
  }
}

# 3. Database Security Group: Inbound MySQL Port 3306 ONLY from App SG
resource "aws_security_group" "db_sg" {
  name        = "${var.project_name}-db-sg"
  description = "Allows incoming MySQL traffic from backend EC2 instances only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Allow MySQL port 3306 from App Security Group only"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  egress {
    description = "Allow outbound responses"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-db-sg"
  }
}

# -----------------------------------------------------------------------------
# 4. DATABASE TIER (Tier 3: Amazon RDS MySQL 8.0)
# -----------------------------------------------------------------------------

# DB Subnet Group across the 2 private DB subnets
resource "aws_db_subnet_group" "quickcart" {
  name        = "${var.project_name}-db-subnet-group"
  description = "Subnet group for QuickCart RDS instance in private subnets"
  subnet_ids  = [aws_subnet.private_db_1.id, aws_subnet.private_db_2.id]

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

# RDS MySQL Instance
resource "aws_db_instance" "quickcart" {
  identifier            = "${var.project_name}-mysql"
  engine                = "mysql"
  engine_version        = "8.0"
  instance_class        = var.db_instance_class
  allocated_storage     = 20
  max_allocated_storage = 50
  storage_type          = "gp3"

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.quickcart.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]

  publicly_accessible = false
  skip_final_snapshot = true
  deletion_protection = false

  tags = {
    Name = "${var.project_name}-mysql-db"
  }
}

# -----------------------------------------------------------------------------
# 5. APPLICATION TIER (Tier 2: IAM, ALB, Target Group, Launch Template, ASG)
# -----------------------------------------------------------------------------

# IAM Role for EC2 (Enables AWS SSM Session Manager & CloudWatch without SSH keys)
resource "aws_iam_role" "ec2_ssm_role" {
  name = "${var.project_name}-ec2-ssm-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ec2_ssm_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-instance-profile"
  role = aws_iam_role.ec2_ssm_role.name
}

# Application Load Balancer in Public Subnets
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  enable_deletion_protection = false

  tags = {
    Name = "${var.project_name}-alb"
  }
}

# ALB Target Group pointing to EC2 backend port 5001 with /api/health
resource "aws_lb_target_group" "backend_tg" {
  name        = "${var.project_name}-backend-tg"
  port        = 5001
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"

  health_check {
    enabled             = true
    path                = "/api/health"
    port                = "5001"
    protocol            = "HTTP"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }

  tags = {
    Name = "${var.project_name}-backend-tg"
  }
}

# ALB Listener (Forward HTTP traffic to Target Group)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend_tg.arn
  }
}

# EC2 Launch Template with Docker & Backend Container Deployment
resource "aws_launch_template" "backend_lt" {
  name_prefix   = "${var.project_name}-lt-"
  image_id      = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.app_sg.id]
  }

  # User Data Script: Automates Docker installation, waits for RDS, seeds DB, & runs container
  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -e
    exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

    echo "=========================================================="
    echo "Starting QuickCart EC2 Backend Container Setup"
    echo "=========================================================="

    # 1. Update packages & install Docker and Git
    dnf update -y
    dnf install -y docker git nc

    # 2. Start & enable Docker service
    systemctl start docker
    systemctl enable docker
    usermod -aG docker ec2-user

    # Database parameters from Terraform
    DB_HOST="${aws_db_instance.quickcart.address}"
    DB_PORT="3306"
    DB_USER="${var.db_username}"
    DB_PASS="${var.db_password}"
    DB_NAME="${var.db_name}"
    JWT_SECRET="${var.jwt_secret}"
    DOCKER_IMAGE="${var.docker_image}"

    echo "Waiting for RDS MySQL to become accessible at $DB_HOST:$DB_PORT..."
    until nc -z -v -w5 "$DB_HOST" "$DB_PORT" 2>/dev/null; do
      echo "RDS not ready yet... sleeping 5 seconds"
      sleep 5
    done
    echo "✅ RDS MySQL is reachable!"

    # 3. Initialize schema and seed data in RDS using temporary MySQL client container
    echo "Running database table verification / initialization..."
    docker run --rm \
      -e MYSQL_PWD="$DB_PASS" \
      mysql:8.0 mysql -h "$DB_HOST" -u "$DB_USER" -e "
        CREATE DATABASE IF NOT EXISTS $DB_NAME;
        USE $DB_NAME;
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          image_url VARCHAR(1000) NOT NULL,
          category VARCHAR(100) DEFAULT 'General',
          stock INT DEFAULT 50,
          rating DECIMAL(2, 1) DEFAULT 4.5,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          customer_name VARCHAR(255) NOT NULL,
          customer_email VARCHAR(255) NOT NULL,
          customer_address TEXT NOT NULL,
          total_amount DECIMAL(10, 2) NOT NULL,
          status VARCHAR(50) DEFAULT 'Confirmed',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
        CREATE TABLE IF NOT EXISTS order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity INT NOT NULL DEFAULT 1,
          unit_price DECIMAL(10, 2) NOT NULL,
          subtotal DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
        );
        INSERT INTO products (name, description, price, image_url, category, stock, rating)
        SELECT * FROM (
          SELECT 'Noise ColorFit Pro 5 Smartwatch', '1.85\" AMOLED display with Bluetooth calling, 7-day battery life, heart-rate tracking.', 2999.00, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80', 'Electronics', 45, 4.7
          UNION ALL SELECT 'boAt Rockerz 450 Bluetooth Headphones', 'Wireless on-ear headphones with 40mm dynamic drivers, 15H playback.', 1499.00, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80', 'Audio', 60, 4.5
          UNION ALL SELECT 'Wildcraft Casual Laptop Backpack 30L', 'Durable water-resistant backpack featuring padded laptop sleeve.', 1299.00, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80', 'Accessories', 35, 4.6
          UNION ALL SELECT 'Prestige Electric Kettle 1.5L', 'Stainless steel rapid boil kettle with automatic safety shut-off.', 899.00, 'https://images.unsplash.com/photo-1594213114663-ddf4f24cf292?w=600&auto=format&fit=crop&q=80', 'Appliances', 80, 4.3
          UNION ALL SELECT 'Portronics SoundDrum 10W Bluetooth Speaker', 'Compact cylindrical speaker with rich 360-degree sound, punchy bass.', 1199.00, 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80', 'Audio', 50, 4.4
          UNION ALL SELECT 'Puma Men\'s Hydro Glide Running Shoes', 'Engineered mesh upper with responsive EVA midsole cushioning.', 2499.00, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80', 'Footwear', 25, 4.8
        ) AS seed
        WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);
      " || echo "Database initialized or already present."

    # 4. Deploy Backend Container
    if [ -n "$DOCKER_IMAGE" ]; then
      echo "Pulling Docker image: $DOCKER_IMAGE..."
      docker pull "$DOCKER_IMAGE"
      IMAGE_TO_RUN="$DOCKER_IMAGE"
    else
      echo "Cloning QuickCart repository and building image locally..."
      cd /opt
      git clone "${var.git_repo_url}" quickcart || true
      if [ -d "/opt/quickcart/backend" ]; then
        cd /opt/quickcart/backend
        docker build -t quickcart-backend:latest .
        IMAGE_TO_RUN="quickcart-backend:latest"
      else
        echo "Creating standalone QuickCart container package..."
        mkdir -p /opt/quickcart-standalone
        cd /opt/quickcart-standalone
        # Fallback inline container builder if git repo not set
        cat << 'INNER_EOF' > package.json
{
  "name": "quickcart-backend",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "mysql2": "^3.12.0"
  }
}
INNER_EOF
        cat << 'INNER_EOF' > Dockerfile
FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 5001
CMD ["node", "server.js"]
INNER_EOF
        # Fetch or copy backend code
        curl -s https://raw.githubusercontent.com/nikhil-singh/quickcart/main/backend/src/server.js -o server.js || true
        docker build -t quickcart-backend:latest .
        IMAGE_TO_RUN="quickcart-backend:latest"
      fi
    fi

    # 5. Run QuickCart Backend Container connected to Amazon RDS
    echo "Starting container $IMAGE_TO_RUN on port 5001..."
    docker run -d \
      --name quickcart-backend \
      --restart always \
      -p 5001:5001 \
      -e PORT=5001 \
      -e NODE_ENV=production \
      -e DB_HOST="$DB_HOST" \
      -e DB_PORT="$DB_PORT" \
      -e DB_USER="$DB_USER" \
      -e DB_PASSWORD="$DB_PASS" \
      -e DB_NAME="$DB_NAME" \
      -e DB_SSL=false \
      -e CLIENT_URL="*" \
      -e JWT_SECRET="$JWT_SECRET" \
      -e JWT_EXPIRES_IN="7d" \
      "$IMAGE_TO_RUN"

    echo "✅ QuickCart Backend Container started successfully!"
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-backend-instance"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group in Private App Subnets across 2 Availability Zones
resource "aws_autoscaling_group" "backend_asg" {
  name_prefix         = "${var.project_name}-asg-"
  vpc_zone_identifier = [aws_subnet.private_app_1.id, aws_subnet.private_app_2.id]
  target_group_arns   = [aws_lb_target_group.backend_tg.arn]

  min_size         = var.asg_min_size
  max_size         = var.asg_max_size
  desired_capacity = var.asg_desired_capacity

  health_check_type         = "ELB"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.backend_lt.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-backend-asg"
    propagate_at_launch = true
  }
}

# -----------------------------------------------------------------------------
# 6. OUTPUTS
# -----------------------------------------------------------------------------
output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_url" {
  description = "Public URL for QuickCart Application Load Balancer"
  value       = "http://${aws_lb.main.dns_name}"
}

output "health_check_url" {
  description = "URL to test ALB health check target"
  value       = "http://${aws_lb.main.dns_name}/api/health"
}

output "products_api_url" {
  description = "URL to test products catalog endpoint"
  value       = "http://${aws_lb.main.dns_name}/api/products"
}

output "rds_endpoint" {
  description = "Private Amazon RDS MySQL connection endpoint"
  value       = aws_db_instance.quickcart.endpoint
}

output "rds_address" {
  description = "Private Amazon RDS MySQL hostname"
  value       = aws_db_instance.quickcart.address
}

output "vercel_frontend_config" {
  description = "Environment variable value to paste into your Vercel Project Settings"
  value       = "VITE_API_BASE_URL=http://${aws_lb.main.dns_name}"
}
