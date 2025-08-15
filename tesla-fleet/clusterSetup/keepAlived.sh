sudo tee /etc/keepalived/keepalived.conf <<EOF
global_defs {
    enable_script_security
    script_user root
    max_auto_priority 50
}

vrrp_script chk_haproxy {
    script "/usr/bin/pgrep haproxy"
    interval 2
    weight 2
}
# put your own interface by inspecting your network on VM for proper interface config
vrrp_instance k3s-vip {
    state MASTER
    interface enp0s1
    virtual_router_id 51
    priority 200
    advert_int 1

    authentication {
        auth_type PASS
        auth_pass cmbo77 #keep under 8 char for spec compliance 
    }

    virtual_ipaddress {
        10.10.10.100/24
    }

    track_script {
        chk_haproxy
    }
}
EOF
