# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Build the Next.js application for production
RUN npm run build

# Your app binds to port 3000, so expose it
EXPOSE 3000

# Define the command to start the production server
CMD [ "npm", "start" ]
