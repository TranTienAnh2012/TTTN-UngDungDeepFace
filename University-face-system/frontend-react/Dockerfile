FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Expose port 5173 and run dev mode
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]
