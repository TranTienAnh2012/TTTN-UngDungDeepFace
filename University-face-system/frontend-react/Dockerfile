FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Expose port 5176 and run dev mode
EXPOSE 5176
CMD ["npm", "run", "dev", "--", "--host", "--port", "5176"]
