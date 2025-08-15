multipass exec postgres-ha -- bash -c '
  sudo apt-get update -qq
  sudo apt-get install -y postgresql
  sudo -u postgres psql -c "CREATE DATABASE k3s_cluster;"
  sudo -u postgres psql -c "CREATE USER k3s_user WITH ENCRYPTED PASSWORD '\''cmbo**77^!'\'';"
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE k3s_cluster TO k3s_user;"
  sudo sed -i "s/#listen_addresses.*/listen_addresses='\''*'\''/" /etc/postgresql/*/main/postgresql.conf
  echo \"host all all 0.0.0.0/0 md5\" | sudo tee -a /etc/postgresql/*/main/pg_hba.conf
  sudo systemctl restart postgresql
'
