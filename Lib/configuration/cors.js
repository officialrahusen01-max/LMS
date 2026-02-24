const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:2000",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "http://192.168.1.9:3000",
    ];
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg =
        "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: "GET, PUT, POST, DELETE, PATCH, OPTIONS",
  allowedHeaders:
    "Origin, X-Requested-With, Content-Type, Accept, Authorization,  x-session-id",
};

export default corsOptions;
