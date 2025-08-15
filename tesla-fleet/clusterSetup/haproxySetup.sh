sudo tee /etc/haproxy/haproxy.cfg <<EOF
frontend k3s-frontend
    bind *:6443
    mode tcp
    option tcplog
    default_backend k3s-backend

backend k3s-backend
    mode tcp
    option tcp-check
    balance roundrobin
    default-server inter 10s downinter 5s rise 2 fall 3
    server server-1 192.168.64.2:6443 check
    server server-2 192.168.64.3:6443 check
    server server-3 192.168.64.4:6443 check
EOF
