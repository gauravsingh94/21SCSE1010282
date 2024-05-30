const express = require("express");
const axios = require("axios");
const app = express();
const port = 3000;
app.use(express.json());

let token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzE3MDYyNzI5LCJpYXQiOjE3MTcwNjI0MjksImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjcxN2RiNzUwLTFhNTktNGNmYS04NzU3LTMxZjMwM2Q4ZjczMiIsInN1YiI6ImdhdXJhdnJhanB1dHNpbmdoOTRAZ21haWwuY29tIn0sImNvbXBhbnlOYW1lIjoiMTAweERldiIsImNsaWVudElEIjoiNzE3ZGI3NTAtMWE1OS00Y2ZhLTg3NTctMzFmMzAzZDhmNzMyIiwiY2xpZW50U2VjcmV0IjoiYlhkenBZaU5wbWdvY3pkVCIsIm93bmVyTmFtZSI6IkdhdXJhdiIsIm93bmVyRW1haWwiOiJnYXVyYXZyYWpwdXRzaW5naDk0QGdtYWlsLmNvbSIsInJvbGxObyI6Ijg5In0.6Q0iQLmUoJ4eqJalKm3TaDYuFqxCu5ia5eJ3B0nF6iQ';

app.post("/register", async (req, res) => {
  const { companyName, ownerName, rollNo, ownerEmail, accessCode } = req.body;
  try {
    const response = await axios.post("http://20.244.56.144/test/register", {
      companyName,
      ownerName,
      rollNo,
      ownerEmail,
      accessCode,
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/auth", async (req, res) => {
  const { companyName, clientID, clientSecret, ownerName, ownerEmail, rollNo } =
    req.body;
  try {
    const response = await axios.post("http://20.244.56.144/test/auth", {
      companyName,
      clientID,
      clientSecret,
      ownerName,
      ownerEmail,
      rollNo,
    });
    token = response.data.access_token;
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/categories/:categoryname/products", async (req, res) => {
  const { categoryname } = req.params;
  const { top, minPrice, maxPrice, sort, page } = req.query;

  if (!token) {
    return res
      .status(401)
      .json({ error: "Unauthorized. Please authenticate first." });
  }

  try {

    const companies = ["AMZ", "FLP", "SNP", "MYN", "AZO"];
    const productPromises = companies.map((company) =>
      axios.get(
        `http://20.244.56.144/test/companies/${company}/categories/${categoryname}/products`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { top, minPrice, maxPrice },
        }
      )
    );

    const responses = await Promise.all(productPromises);
    let products = responses.flatMap((response) => response.data);

    if (sort) {
      const [sortField, sortOrder] = sort.split(":");
      products.sort((a, b) => {
        if (sortOrder === "desc") {
          return b[sortField] - a[sortField];
        }
        return a[sortField] - b[sortField];
      });
    }

    const pageSize = parseInt(top, 10) || 10;
    const pageNumber = parseInt(page, 10) || 1;
    const paginatedProducts = products.slice(
      (pageNumber - 1) * pageSize,
      pageNumber * pageSize
    );

    paginatedProducts.forEach((product, index) => {
      product.id = `${categoryname}-${pageNumber}-${index}`;
    });

    res.json(paginatedProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/categories/:categoryname/products/:productid", async (req, res) => {
  const { categoryname, productid } = req.params;

  if (!token) {
    return res
      .status(401)
      .json({ error: "Unauthorized. Please authenticate first." });
  }

  try {
    const [category, page, index] = productid.split("-");
    const pageSize = 10; 

    const companies = ["AMZ", "FLP", "SNP", "MYN", "AZO"];
    const productPromises = companies.map((company) =>
      axios.get(
        `http://20.244.56.144/test/companies/${company}/categories/${categoryname}/products`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { top: pageSize, minPrice: 0, maxPrice: Infinity },
        }
      )
    );

    const responses = await Promise.all(productPromises);
    let products = responses.flatMap((response) => response.data);

    const product = products[parseInt(index, 10)];
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
