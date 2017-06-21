# kube-etoc
This is app for transform service discovery on etcd to consul service discovery format.

Howto use it.
1. Clone
git clone https://github.com/peerapach/kube-etoc.git
2. Copy Kubernetes's ca, client cert and client key to ssl
mkdir ssl
cp ca.crt client.pem client.key ssl
3. Build container
docker build -t YOUR_REPO/kube-etoc .
4. Run
run docker with env SERVER_IP=x.x.x.x
5. Get data
curl http://docker_ip:3000/services/NAMESPACE/REPLICATIONCONTROLLER_NAME
