#!/bin/bash

# Create directory structure
mkdir -p src/{api/{controllers,middlewares,routes},services,types,utils,config} \
       firebase \
       scripts \
       public/assets

# Create empty files
touch deno.json
touch import_map.json
touch .env.example
touch .gitignore
touch firebase/{firestore.rules,storage.rules,firestore.indexes.json}
touch src/app.ts
touch src/config/firebase.config.ts
touch src/api/controllers/{event,business,ad,user}.controller.ts
touch src/api/middlewares/{auth,error}.middleware.ts
touch src/api/routes/{event,business,ad,user}.routes.ts
touch src/services/{event,business,ad,analytics}.service.ts
touch src/types/{event,business,ad,user}.types.ts
touch src/utils/{firebase-admin,logger,constants}.ts
touch scripts/{deploy,seed-data}.ts
touch README.md

echo "Project structure created successfully!"
EOF

Save this as `setup.sh`, then run:

```bash
chmod +x setup.sh
./setup.sh
```

This will create all the folders and empty files without any content. Would you like me to generate this script with any modifications?