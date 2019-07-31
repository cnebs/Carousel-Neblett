import React from "react";
import Carousel from "./carousel.jsx";
import Axios from "axios";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      productId: "0",
      carouselNames: [
        "Customers Also Viewed",
        "Related Items",
        "Previously Viewed"
      ],
      carousels: {
        alsoViewed: [],
        related: [],
        prevViewed: []
      },
      reviews: {
        alsoViewed: [],
        related: [],
        prevViewed: []
      },
      prices: {
        alsoViewed: [],
        related: [],
        prevViewed: []
      }
    };
    this.handleClick = this.handleClick.bind(this);
    this.scrollToTop = this.scrollToTop.bind(this);
    this.emitProductId = this.emitProductId.bind(this);
    this.updateUserHistory = this.updateUserHistory.bind(this);
    this.getCarousels = this.getCarousels.bind(this);
    this.getPrices = this.getPrices.bind(this);
    this.getReviews = this.getReviews.bind(this);
    this.renderCarousels = this.renderCarousels.bind(this);
    this.updateProductView = this.updateProductView.bind(this);
  }

  componentDidMount() {
    window.addEventListener("product", e => {
      const clickedId = e.detail.product_id.toString();
      this.updateProductView(clickedId);
    });
    window.addEventListener("stars", e => {
      this.updateProductView(this.state.productId);
    });
    this.updateUserHistory(this.state.productId)
      .then(this.getCarousels)
      .then(this.renderCarousels)
      .then(this.getPrices)
      .then(this.getReviews)
      .catch(err => {
        console.log(err);
      });
  }

  handleClick(e) {
    const clickedId = Number(
      e.target.id.slice(e.target.id.length - 3)
    ).toString();
    this.emitProductId(clickedId);
    this.scrollToTop();
  }

  scrollToTop() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: "auto"
    });
  }

  emitProductId(productId) {
    let product = new CustomEvent("product", {
      detail: { product_id: Number(productId) }
    });
    window.dispatchEvent(product);
  }

  updateUserHistory(selectedProductId) {
    return Number(selectedProductId) > 0 && Number(selectedProductId) < 101
      ? Axios.post(
          "http://localhost:3000/users",
          {
            itemId: selectedProductId
          },
          { withCredentials: true }
        )
      : new Promise((res, rej) => {
          setTimeout(() => {
            res();
          }, 0);
        });
  }

  getCarousels() {
    return Number(this.state.productId) > 0 &&
      Number(this.state.productId) < 101
      ? Axios.get(
          `http://localhost:3000/carousels?id=${this.state.productId}`,
          { withCredentials: true }
        )
      : new Promise((res, rej) => {
          setTimeout(() => {
            res();
          }, 0);
        });
  }

  getPrices() {
    Axios.get(
      `http://ec2-18-188-213-241.us-east-2.compute.amazonaws.com/prices/all`,
      { withCredentials: true }
    )
      .then(allPrices => {
        const prices = {};
        for (let carousel in this.state.carousels) {
          const arr = [];
          this.state.carousels[carousel].forEach(item => {
            const allPriceData = allPrices.data;
            for (let i = 0; i < allPriceData.length; i++) {
              let checkItem = allPriceData[i];
              if (checkItem.SS === Number(item.id)) {
                arr.push(checkItem.price);
                if (arr.length === carousel.length) {
                  break;
                }
              }
            }
          });
          prices[carousel] = arr;
        }
        return prices;
      })
      .then(applicablePrices => {
        this.setState({
          prices: applicablePrices
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  getReviews() {
    Axios.get(
      `http://ec2-18-225-6-113.us-east-2.compute.amazonaws.com/api/stats/all`,
      { withCredentials: true }
    )
      .then(allReviews => {
        const reviews = {};
        for (let carousel in this.state.carousels) {
          const arr = [];
          this.state.carousels[carousel].forEach(item => {
            const reviewData = allReviews.data[item.id - 1].reviewStats;
            arr.push([reviewData.reviewCount, reviewData.averageStars]);
          });
          reviews[carousel] = arr;
        }
        return reviews;
      })
      .then(applicableReviews => {
        this.setState({
          reviews: applicableReviews
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  renderCarousels(newCarousels) {
    newCarousels ?
    this.setState({
      carousels: newCarousels.data
    }) : null;
  }

  updateProductView(newProductId) {
    this.setState({ productId: newProductId });
    this.updateUserHistory(newProductId)
      .then(this.getCarousels)
      .then(this.renderCarousels)
      .then(this.getPrices)
      .then(this.getReviews)
      .catch(err => {
        console.log("event listener says: ", err);
      });
  }

  render() {
    return (
      <div>
        {this.state.carousels.alsoViewed.length > 0 ? (
          <Carousel
            name={this.state.carouselNames[0]}
            images={this.state.carousels.alsoViewed.slice(0, 15)}
            prices={this.state.prices.alsoViewed}
            reviews={this.state.reviews.alsoViewed}
            handleClick={this.handleClick}
          />
        ) : null}
        {this.state.carousels.related.length > 0 ? (
          <Carousel
            name={this.state.carouselNames[1]}
            images={this.state.carousels.related.slice(0, 15)}
            prices={this.state.prices.related}
            reviews={this.state.reviews.related}
            handleClick={this.handleClick}
          />
        ) : null}
        {this.state.carousels.prevViewed.length > 0 ? (
          <Carousel
            name={this.state.carouselNames[2]}
            images={this.state.carousels.prevViewed.slice(0, 15)}
            prices={this.state.prices.prevViewed}
            reviews={this.state.reviews.prevViewed}
            handleClick={this.handleClick}
          />
        ) : null}
      </div>
    );
  }
}

export default App;
