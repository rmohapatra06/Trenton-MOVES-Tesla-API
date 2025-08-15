# Run the following command for server-2 and server-3 (one liner injects the K3S TOKEN val)
multipass exec server-3 -- bash -lc '
  echo "Using K3S_TOKEN: '"$K3S_TOKEN"'" 
  curl -sfL https://get.k3s.io | \
    K3S_TOKEN='"$K3S_TOKEN"' \
    sh -s - server \
      --server https://10.10.10.100:6443 \
      --datastore-endpoint "postgres://k3s_user:thebigflute2006@192.168.64.8:5432/k3s_cluster" \
      --tls-san 10.10.10.100
'


exit
