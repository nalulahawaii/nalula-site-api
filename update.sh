
#!/bin/bash
cd /home/bitnami/projects/nalula-user-api
echo "get latest"
git pull
echo "install"
npm i
echo "restarting"
pm2 restart server