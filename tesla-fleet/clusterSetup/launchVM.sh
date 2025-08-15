# Control plane
for n in 1 2 3; do
  multipass launch 22.04 --name server-$n --cpus 2 --memory 2G --disk 10G
done

# Workers
multipass launch 22.04 --name agent-1 --cpus 2 --memory 2G --disk 10G

# Load balancers
for n in 1 2; do
  multipass launch 22.04 --name lb-$n --cpus 1 --memory 512M --disk 5G
done

# External Postgres for the control‑plane datastore
multipass launch 22.04 --name postgres-ha --cpus 1 --memory 1G --disk 5G
