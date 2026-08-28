public class HelloWorld {
    public static void main(String[] args) {

        float weight = 30000.2F;
        double weightPropotionPerFood = (double) 5 /100 * weight;
        int feedingtimesPerday = 3;
        double foodServedPerFeeding = weightPropotionPerFood/feedingtimesPerday;

        System.out.println(weightPropotionPerFood);
        System.out.println(foodServedPerFeeding);

       int x = 1;
       x++;
       System.out.println(x);



    }
}
