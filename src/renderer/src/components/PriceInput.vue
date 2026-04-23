<template>
    <el-input
      :value="display"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
      clearable
      :disabled="disabled"
    >
      <template slot="append">₺</template>
    </el-input>
  </template>
  
  <script>
  export default {
    name: "PriceInput",
    props: {
      value: { type: [Number, String], default: 0 }, // v-model
      decimals: { type: Number, default: 2 },        // ondalık hassasiyeti
      min: { type: Number, default: 0 },             // minimum değer
      disabled: false
    },
    data() {
      return {
        display: "",         // inputta görünen string
        isFocused: false,
      };
    },
    watch: {
      value: {
        immediate: true,
        handler(val) {
          // dışarıdan değer değişirse display'i güncelle
          if (!this.isFocused) {
            const num = this.normalizeToNumber(val);
            this.display = this.formatForDisplay(num);
          }
        },
      },
    },
    methods: {
      // Kullanıcı yazarken sadece rakam / . / , kalsın, tek ayırıcıya indir
      sanitizeInput(str) {
        if (str == null) return "";
        str = String(str).replace(/[^\d.,]/g, ""); // rakam, . ve , dışını at
        // virgülü noktaya çevir
        str = str.replace(/,/g, ".");
        // birden fazla nokta varsa ilkini bırak, kalanları sil
        const firstDot = str.indexOf(".");
        if (firstDot !== -1) {
          const head = str.slice(0, firstDot + 1);
          const tail = str.slice(firstDot + 1).replace(/\./g, "");
          str = head + tail;
        }
        // ondalık basamak sayısını sınırla
        const parts = str.split(".");
        if (parts.length === 2) {
          parts[1] = parts[1].slice(0, this.decimals);
          str = parts[0] + "." + parts[1];
        }
        // baştaki sıfırları normalize et (ondalıktan önce)
        str = str.replace(/^0+(\d)/, "$1");
        return str;
      },
      normalizeToNumber(val) {
        if (val === "" || val == null) return 0;
        const num =
          typeof val === "number"
            ? val
            : Number(String(val).replace(/\./g, "").replace(",", "."));
        return isNaN(num) ? 0 : num;
      },
      clamp(n) {
        if (n < this.min) return this.min;
        return n;
      },
      handleInput(raw) {
        // yazarken temizle → emit et → display'i temiz haliyle göster
        const cleaned = this.sanitizeInput(raw);
        const num = this.clamp(Number(cleaned || 0));
        this.$emit("input", Number(num.toFixed(this.decimals))); // v-model güncelle
        this.display = cleaned; // yazarken formatlama yok, kullanıcıyı rahatsız etme
      },
      handleFocus() {
        this.isFocused = true;
        const num = this.normalizeToNumber(this.value);
        this.display = num ? String(Number(num.toFixed(this.decimals))) : "";
      },
      handleBlur() {
        this.isFocused = false;
        const num = this.normalizeToNumber(this.display);
        const clamped = this.clamp(num);
        // blur'da kesin değeri emit et (precision uygulanmış)
        this.$emit("input", Number(clamped.toFixed(this.decimals)));
        
        this.$emit("blur");
        this.$emit("change", Number(clamped.toFixed(this.decimals)));
        this.display = this.formatForDisplay(clamped);
      },
      formatForDisplay(n) {
        const num = Number(isNaN(n) ? 0 : n);
        // tr-TR formatı, para birimi işaretini append slot'ta gösteriyoruz
        return new Intl.NumberFormat("tr-TR", {
          minimumFractionDigits: this.decimals,
          maximumFractionDigits: this.decimals,
        }).format(num);
      },
    },
  };
  </script>
  