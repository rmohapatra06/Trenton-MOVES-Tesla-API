multipass exec agent-1 -- sudo bash -lc '
  echo "⏳ Joining worker node to https://10.10.10.100:6443"
  curl -sfL https://get.k3s.io | sh -s - \
    agent \
    --server https://10.10.10.100:6443 \
    --token '"$K3S_TOKEN"'
'
