#!/bin/bash
ACTIVE_COLOR=${ACTIVE_COLOR:-blue}
exec docker run --rm --name medlm_frontend -p 3000:3000 --env-file /home/ubuntu/.envs/client/.env medlm_client:$ACTIVE_COLOR
