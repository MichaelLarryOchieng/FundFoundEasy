public class TradForLoop {
    public static void main(String[] args){
        for(int i = 1; i <= 3; i++){
            System.out.println(i);
        }
        System.out.println("Now we go to Traditional for loop with an Array");
        int[] ia = {1, 2, 3};
        for( int i = 0; i < ia.length; i ++){
            System.out.println(ia[i]);
        }
    }

}
