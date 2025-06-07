    class CryptoChart {
      constructor(container, symbol, interval = '1m') {
        this.chartContainer = container;
        this.symbol = symbol;
        this.interval = interval;
        this.chart = LightweightCharts.createChart(this.chartContainer, {
          layout: {
            background: { color: '#121212' },
            textColor: '#d1d4dc',
          },
          grid: {
            vertLines: { visible: false },
            horzLines: { visible: false },
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            rightOffset: 10,
          },
          crosshair: {
            mode: 1,
          },
        });

        this.candleSeries = this.chart.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        });

        this.loadHistoricalData();
        this.setupResizeObserver();
      }

      async loadHistoricalData() {
        try {
          const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${this.symbol}&interval=${this.interval}&limit=1440`;
          const res = await fetch(url);
          const data = await res.json();
          const candles = data.map(c => ({
            time: c[0] / 1000,
            open: parseFloat(c[1]),
            high: parseFloat(c[2]),
            low: parseFloat(c[3]),
            close: parseFloat(c[4]),
          }));
          this.candleSeries.setData(candles);
          this.connectWebSocket();
        } catch (error) {
          console.error(`Erro carregando dados para ${this.symbol}`, error);
        }
      }

      connectWebSocket() {
        const wsSymbol = this.symbol.toLowerCase();
        const wsInterval = this.interval;
        const url = `wss://fstream.binance.com/ws/${wsSymbol}@kline_${wsInterval}`;
        const socket = new WebSocket(url);

        socket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          if (message.k) {
            const k = message.k;
            const candle = {
              time: k.t / 1000,
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c),
            };
            this.candleSeries.update(candle);
          }
        };

        socket.onclose = () => {
          setTimeout(() => this.connectWebSocket(), 3000);
        };
      }

      setupResizeObserver() {
        const ro = new ResizeObserver(() => {
          this.chart.applyOptions({
            width: this.chartContainer.clientWidth,
            height: this.chartContainer.clientHeight
          });
          this.chart.timeScale().fitContent();
        });
        ro.observe(this.chartContainer);
      }
    }

    new CryptoChart(document.getElementById('btc-chart'), 'BTCUSDT');
    new CryptoChart(document.getElementById('eth-chart'), 'ETHUSDT');
    new CryptoChart(document.getElementById('bnb-chart'), 'BNBUSDT');
    new CryptoChart(document.getElementById('sol-chart'), 'SOLUSDT');
    new CryptoChart(document.getElementById('ada-chart'), 'ADAUSDT');
    new CryptoChart(document.getElementById('xrp-chart'), 'XRPUSDT');